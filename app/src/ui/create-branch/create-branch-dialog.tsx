import * as React from 'react'

import { Repository } from '../../models/repository'
import { Dispatcher } from '../dispatcher'
import { Branch, StartPoint } from '../../models/branch'
import { Row } from '../lib/row'
import { Ref } from '../lib/ref'
import { LinkButton } from '../lib/link-button'
import { Dialog, DialogContent, DialogFooter } from '../dialog'
import {
  VerticalSegmentedControl,
  ISegmentedItem,
} from '../lib/vertical-segmented-control'
import {
  TipState,
  IUnbornRepository,
  IDetachedHead,
  IValidBranch,
} from '../../models/tip'
import { assertNever } from '../../lib/fatal-error'
import { renderBranchNameExistsOnRemoteWarning } from '../lib/branch-name-warnings'
import { getStartPoint } from '../../lib/create-branch'
import { OkCancelButtonGroup } from '../dialog/ok-cancel-button-group'
import { startTimer } from '../lib/timing'
import { GitHubRepository } from '../../models/github-repository'
import { RefNameTextBox } from '../lib/ref-name-text-box'
import { CommitOneLine } from '../../models/commit'
import { PopupType } from '../../models/popup'
import { RepositorySettingsTab } from '../repository-settings/repository-settings'
import { isRepositoryWithForkedGitHubRepository } from '../../models/repository'
import { IAPIRepoRuleset } from '../../lib/api'
import { Account } from '../../models/account'
import {
  IBranchRuleError,
  checkBranchNameRules,
  renderBranchNameRuleError,
} from '../lib/branch-name-rule-validation'
import { withTranslation, WithTranslation, Trans } from 'react-i18next'

interface ICreateBranchProps {
  readonly repository: Repository
  readonly targetCommit?: CommitOneLine
  readonly upstreamGitHubRepository: GitHubRepository | null
  readonly accounts: ReadonlyArray<Account>
  readonly cachedRepoRulesets: ReadonlyMap<number, IAPIRepoRuleset>
  readonly dispatcher: Dispatcher
  readonly onBranchCreatedFromCommit?: () => void
  readonly onDismissed: () => void
  /**
   * If provided, the branch creation is handled by the given method.
   *
   * It is also responsible for dismissing the popup.
   */
  readonly createBranch?: (
    name: string,
    startPoint: string | null,
    noTrack: boolean
  ) => void
  readonly tip: IUnbornRepository | IDetachedHead | IValidBranch
  readonly defaultBranch: Branch | null
  readonly upstreamDefaultBranch: Branch | null
  readonly allBranches: ReadonlyArray<Branch>
  readonly initialName: string
  /**
   * If provided, use as the okButtonText
   */
  readonly okButtonText?: string

  /**
   * If provided, use as the header
   */
  readonly headerText?: string
}

interface ICreateBranchState {
  readonly currentError: IBranchRuleError | null
  readonly branchName: string
  readonly startPoint: StartPoint

  /**
   * Whether or not the dialog is currently creating a branch. This affects
   * the dialog loading state as well as the rendering of the branch selector.
   *
   * When the dialog is creating a branch we take the tip and defaultBranch
   * as they were in props at the time of creation and stick them in state
   * so that we can maintain the layout of the branch selection parts even
   * as the Tip changes during creation.
   *
   * Note: once branch creation has been initiated this value stays at true
   * and will never revert to being false. If the branch creation operation
   * fails this dialog will still be dismissed and an error dialog will be
   * shown in its place.
   */
  readonly isCreatingBranch: boolean

  /**
   * The tip of the current repository, captured from props at the start
   * of the create branch operation.
   */
  readonly tipAtCreateStart: IUnbornRepository | IDetachedHead | IValidBranch

  /**
   * The default branch of the current repository, captured from props at the
   * start of the create branch operation.
   */
  readonly defaultBranchAtCreateStart: Branch | null
}

class CreateBranchInternal extends React.Component<
  ICreateBranchProps & WithTranslation,
  ICreateBranchState
> {
  private branchRulesDebounceId: number | null = null

  private readonly ERRORS_ID = 'branch-name-errors'

  public constructor(props: ICreateBranchProps & WithTranslation) {
    super(props)

    const startPoint = getStartPoint(props, StartPoint.UpstreamDefaultBranch)

    this.state = {
      currentError: null,
      branchName: props.initialName,
      startPoint,
      isCreatingBranch: false,
      tipAtCreateStart: props.tip,
      defaultBranchAtCreateStart: getBranchForStartPoint(startPoint, props),
    }
  }

  public componentWillReceiveProps(
    nextProps: ICreateBranchProps & WithTranslation
  ) {
    this.setState({
      startPoint: getStartPoint(nextProps, this.state.startPoint),
    })

    if (!this.state.isCreatingBranch) {
      const defaultStartPoint = getStartPoint(
        nextProps,
        StartPoint.UpstreamDefaultBranch
      )

      this.setState({
        tipAtCreateStart: nextProps.tip,
        defaultBranchAtCreateStart: getBranchForStartPoint(
          defaultStartPoint,
          nextProps
        ),
      })
    }

    if (nextProps.initialName.length > 0) {
      this.checkBranchRules(nextProps.initialName)
    }
  }

  public componentWillUnmount() {
    if (this.branchRulesDebounceId !== null) {
      window.clearTimeout(this.branchRulesDebounceId)
    }
  }

  private renderBranchSelection() {
    const { t } = this.props
    const tip = this.state.isCreatingBranch
      ? this.state.tipAtCreateStart
      : this.props.tip

    const tipKind = tip.kind
    const targetCommit = this.props.targetCommit

    if (targetCommit !== undefined) {
      return (
        <p>
          <Trans
            t={t}
            i18nKey="createBranch.basedOnCommit"
            defaults="Your new branch will be based on the commit '{{summary}}' ({{sha}}) from your repository."
            values={{
              summary: targetCommit.summary,
              sha: targetCommit.sha.substring(0, 7),
            }}
          />
        </p>
      )
    } else if (tip.kind === TipState.Detached) {
      return (
        <p>
          <Trans
            t={t}
            i18nKey="createBranch.detachedHead"
            defaults="You do not currently have any branch checked out (your HEAD reference is detached). As such your new branch will be based on your currently checked out commit ({{sha}})."
            values={{ sha: tip.currentSha.substring(0, 7) }}
          />
        </p>
      )
    } else if (tip.kind === TipState.Unborn) {
      return (
        <p>
          {t(
            'createBranch.unbornBranch',
            'Your current branch is unborn (does not contain any commits). Creating a new branch will rename the current branch.'
          )}
        </p>
      )
    } else if (tip.kind === TipState.Valid) {
      if (
        this.props.upstreamGitHubRepository !== null &&
        this.props.upstreamDefaultBranch !== null
      ) {
        return this.renderForkBranchSelection(
          tip.branch.name,
          this.props.upstreamDefaultBranch,
          this.props.upstreamGitHubRepository.fullName
        )
      }

      const defaultBranch = this.state.isCreatingBranch
        ? this.props.defaultBranch
        : this.state.defaultBranchAtCreateStart

      return this.renderRegularBranchSelection(tip.branch.name, defaultBranch)
    } else {
      return assertNever(tip, `Unknown tip kind ${tipKind}`)
    }
  }

  private onBaseBranchChanged = (startPoint: StartPoint) => {
    this.setState({
      startPoint,
    })
  }

  public render() {
    const { t } = this.props
    const disabled =
      this.state.branchName.length <= 0 ||
      (!!this.state.currentError && !this.state.currentError.isWarning) ||
      /^\s*$/.test(this.state.branchName)
    const hasError = !!this.state.currentError

    return (
      <Dialog
        id="create-branch"
        title={this.getHeaderText()}
        onSubmit={this.createBranch}
        onDismissed={this.props.onDismissed}
        loading={this.state.isCreatingBranch}
        disabled={this.state.isCreatingBranch}
      >
        <DialogContent>
          <RefNameTextBox
            label={t('createBranch.nameLabel', 'Name')}
            ariaDescribedBy={hasError ? this.ERRORS_ID : undefined}
            initialValue={this.props.initialName}
            onValueChange={this.onBranchNameChange}
          />

          {renderBranchNameRuleError(
            this.state.currentError,
            this.ERRORS_ID,
            this.state.branchName
          )}

          {renderBranchNameExistsOnRemoteWarning(
            this.state.branchName,
            this.props.allBranches,
            t
          )}

          {this.renderBranchSelection()}
        </DialogContent>

        <DialogFooter>
          <OkCancelButtonGroup
            okButtonText={this.getOkButtonText()}
            okButtonDisabled={disabled}
          />
        </DialogFooter>
      </Dialog>
    )
  }

  private getHeaderText = (): string => {
    const { t } = this.props
    if (this.props.headerText !== undefined) {
      return this.props.headerText
    }

    return __DARWIN__
      ? t('createBranch.titleDarwin', 'Create a Branch')
      : t('createBranch.titleOther', 'Create a branch')
  }

  private getOkButtonText = (): string => {
    const { t } = this.props
    if (this.props.okButtonText !== undefined) {
      return this.props.okButtonText
    }

    return __DARWIN__
      ? t('createBranch.okButtonDarwin', 'Create Branch')
      : t('createBranch.okButtonOther', 'Create branch')
  }

  private onBranchNameChange = (name: string) => {
    this.updateBranchName(name)
  }

  private async updateBranchName(branchName: string) {
    const { t } = this.props
    this.setState({ branchName })

    const alreadyExists =
      this.props.allBranches.findIndex(b => b.name === branchName) > -1

    const currentError = alreadyExists
      ? {
          error: new Error(
            t(
              'createBranch.alreadyExistsError',
              'A branch named {{branchName}} already exists.',
              { branchName }
            )
          ),
          isWarning: false,
        }
      : null

    if (!currentError) {
      if (this.branchRulesDebounceId !== null) {
        window.clearTimeout(this.branchRulesDebounceId)
      }

      this.branchRulesDebounceId = window.setTimeout(
        this.checkBranchRules,
        500,
        branchName
      )
    }

    this.setState({
      branchName,
      currentError,
    })
  }

  private checkBranchRules = async (branchName: string) => {
    if (
      this.state.branchName !== branchName ||
      branchName === '' ||
      this.state.currentError !== null
    ) {
      return
    }

    const result = await checkBranchNameRules(
      branchName,
      this.props.accounts,
      this.props.repository,
      this.props.cachedRepoRulesets
    )

    // Make sure user branch name hasn't changed during async calls
    if (this.state.branchName !== branchName) {
      return
    }

    if (result !== null) {
      this.setState({ currentError: result })
    }
  }

  private createBranch = async () => {
    const name = this.state.branchName

    let startPoint: string | null = null
    let noTrack = false

    const { defaultBranch, upstreamDefaultBranch, repository } = this.props

    if (this.props.targetCommit !== undefined) {
      startPoint = this.props.targetCommit.sha
    } else if (this.state.startPoint === StartPoint.DefaultBranch) {
      // This really shouldn't happen, we take all kinds of precautions
      // to make sure the startPoint state is valid given the current props.
      if (!defaultBranch) {
        this.setState({
          currentError: {
            error: new Error('Could not determine the default branch.'),
            isWarning: false,
          },
        })
        return
      }

      startPoint = defaultBranch.name
    } else if (this.state.startPoint === StartPoint.UpstreamDefaultBranch) {
      // This really shouldn't happen, we take all kinds of precautions
      // to make sure the startPoint state is valid given the current props.
      if (!upstreamDefaultBranch) {
        this.setState({
          currentError: {
            error: new Error('Could not determine the default branch.'),
            isWarning: false,
          },
        })
        return
      }

      startPoint = upstreamDefaultBranch.name
      noTrack = true
    }

    if (name.length > 0) {
      this.setState({ isCreatingBranch: true })

      // If createBranch is provided, use it instead of dispatcher
      if (this.props.createBranch !== undefined) {
        this.props.createBranch(name, startPoint, noTrack)
        return
      }

      const timer = startTimer('create branch', repository)
      const branch = await this.props.dispatcher.createBranch(
        repository,
        name,
        startPoint,
        noTrack
      )
      timer.done()
      this.props.onDismissed()

      // If the operation was successful and the branch was created from a
      // commit, invoke the callback.
      if (
        branch !== undefined &&
        this.props.targetCommit !== undefined &&
        this.props.onBranchCreatedFromCommit !== undefined
      ) {
        this.props.onBranchCreatedFromCommit()
      }
    }
  }

  /**
   * Render options for a non-fork repository
   *
   * Gives user the option to make a new branch from
   * the default branch.
   */
  private renderRegularBranchSelection(
    currentBranchName: string,
    defaultBranch: Branch | null
  ) {
    const { t } = this.props
    if (defaultBranch === null || defaultBranch.name === currentBranchName) {
      return (
        <div>
          <Trans
            t={t}
            i18nKey="createBranch.basedOnCurrentBranch"
            defaults="Your new branch will be based on your currently checked out branch ({{currentBranch}}){{forkLinkSuffix}}."
            values={{
              currentBranch: currentBranchName,
              forkLinkSuffix: '',
            }}
            components={{ 1: <Ref>{currentBranchName}</Ref> }}
          >
            Your new branch will be based on your currently checked out branch (
            <Ref>{currentBranchName}</Ref>){this.renderForkLinkSuffix()}.
          </Trans>
          {defaultBranch?.name === currentBranchName && (
            <span>
              {' '}
              <Ref>{currentBranchName}</Ref>{' '}
              <Trans
                t={t}
                i18nKey="createBranch.currentBranchIsDefault"
                defaults="is the {{defaultBranchLink}} for your repository."
                values={{ defaultBranchLink: '' }}
                components={{ 1: defaultBranchLink }}
              >
                is the {defaultBranchLink} for your repository.
              </Trans>
            </span>
          )}
        </div>
      )
    } else {
      const items = [
        {
          title: defaultBranch.name,
          description: t(
            'createBranch.defaultBranchOptionDescription',
            "The default branch in your repository. Pick this to start on something new that's not dependent on your current branch."
          ),
          key: StartPoint.DefaultBranch,
        },
        {
          title: currentBranchName,
          description: t(
            'createBranch.currentBranchOptionDescription',
            'The currently checked out branch. Pick this if you need to build on work done on this branch.'
          ),
          key: StartPoint.CurrentBranch,
        },
      ]

      const selectedValue =
        this.state.startPoint === StartPoint.DefaultBranch
          ? this.state.startPoint
          : StartPoint.CurrentBranch

      return (
        <div>
          {this.renderOptions(items, selectedValue)}
          {this.renderForkLink()}
        </div>
      )
    }
  }

  /**
   * Render options if we're in a fork
   *
   * Gives user the option to make a new branch from
   * the upstream default branch.
   */
  private renderForkBranchSelection(
    currentBranchName: string,
    upstreamDefaultBranch: Branch,
    upstreamRepositoryFullName: string
  ) {
    const { t } = this.props
    // we assume here that the upstream and this
    // fork will have the same default branch name
    if (currentBranchName === upstreamDefaultBranch.nameWithoutRemote) {
      return (
        <div>
          <Trans
            t={t}
            i18nKey="createBranch.basedOnUpstreamDefaultBranch"
            defaults="Your new branch will be based on <strong>{{upstreamRepositoryFullName}}</strong>'s {{defaultBranchLink}} ({{upstreamDefaultBranchName}}){{forkLinkSuffix}}."
            values={{
              upstreamRepositoryFullName,
              upstreamDefaultBranchName:
                upstreamDefaultBranch.nameWithoutRemote,
              defaultBranchLink: '',
              forkLinkSuffix: '',
            }}
            components={{
              strong: <strong>{upstreamRepositoryFullName}</strong>,
              ref: <Ref>{upstreamDefaultBranch.nameWithoutRemote}</Ref>,
              1: defaultBranchLink,
            }}
          >
            Your new branch will be based on{' '}
            <strong>{upstreamRepositoryFullName}</strong>
            's {defaultBranchLink} (
            <Ref>{upstreamDefaultBranch.nameWithoutRemote}</Ref>)
            {this.renderForkLinkSuffix()}.
          </Trans>
        </div>
      )
    } else {
      const items = [
        {
          title: t(
            'createBranch.forkUpstreamDefaultBranchOptionTitle',
            'Upstream default branch: {{name}}',
            { name: upstreamDefaultBranch.name }
          ),
          description: t(
            'createBranch.forkUpstreamDefaultBranchOptionDescription',
            "The default branch of the upstream repository. Pick this to start on something new that's not dependent on your current branch."
          ),
          key: StartPoint.UpstreamDefaultBranch,
        },
        {
          title: t(
            'createBranch.forkCurrentBranchOptionTitle',
            'Current branch: {{name}}',
            { name: currentBranchName }
          ),
          description: t(
            'createBranch.forkCurrentBranchOptionDescription',
            'The currently checked out branch. Pick this if you need to build on work done on this branch.'
          ),
          key: StartPoint.CurrentBranch,
        },
      ]

      const selectedValue =
        this.state.startPoint === StartPoint.UpstreamDefaultBranch
          ? this.state.startPoint
          : StartPoint.CurrentBranch
      return (
        <div>
          {this.renderOptions(items, selectedValue)}
          {this.renderForkLink()}
        </div>
      )
    }
  }

  private renderForkLink = () => {
    const { t } = this.props
    if (isRepositoryWithForkedGitHubRepository(this.props.repository)) {
      return (
        <div className="secondary-text">
          <Trans
            t={t}
            i18nKey="createBranch.forkSettingsInfo"
            defaults="Your default branch source is determined by your {{forkSettingsLink}}."
            values={{ forkSettingsLink: '' }}
            components={{
              1: (
                <LinkButton onClick={this.onForkSettingsClick}>
                  {t(
                    'createBranch.forkBehaviorSettings',
                    'fork behavior settings'
                  )}
                </LinkButton>
              ),
            }}
          >
            Your default branch source is determined by your{' '}
            <LinkButton onClick={this.onForkSettingsClick}>
              {t('createBranch.forkBehaviorSettings', 'fork behavior settings')}
            </LinkButton>
            .
          </Trans>
        </div>
      )
    } else {
      return
    }
  }

  private renderForkLinkSuffix = () => {
    const { t } = this.props
    if (isRepositoryWithForkedGitHubRepository(this.props.repository)) {
      return (
        <span>
          <Trans
            t={t}
            i18nKey="createBranch.forkSettingsSuffix"
            defaults=" as determined by your {{forkSettingsLink}}"
            values={{ forkSettingsLink: '' }}
            components={{
              1: (
                <LinkButton onClick={this.onForkSettingsClick}>
                  {t(
                    'createBranch.forkBehaviorSettings',
                    'fork behavior settings'
                  )}
                </LinkButton>
              ),
            }}
          >
            &nbsp;as determined by your{' '}
            <LinkButton onClick={this.onForkSettingsClick}>
              {t('createBranch.forkBehaviorSettings', 'fork behavior settings')}
            </LinkButton>
          </Trans>
        </span>
      )
    } else {
      return
    }
  }

  /** Shared method for rendering two choices in this component */
  private renderOptions = (
    items: ReadonlyArray<ISegmentedItem<StartPoint>>,
    selectedValue: StartPoint
  ) => {
    const { t } = this.props
    return (
      <Row>
        <VerticalSegmentedControl
          label={t(
            'createBranch.createStartPointHeading',
            'Create branch based on…'
          )}
          items={items}
          selectedKey={selectedValue}
          onSelectionChanged={this.onBaseBranchChanged}
        />
      </Row>
    )
  }

  private onForkSettingsClick = () => {
    this.props.dispatcher.showPopup({
      type: PopupType.RepositorySettings,
      repository: this.props.repository,
      initialSelectedTab: RepositorySettingsTab.ForkSettings,
    })
  }
}

/** Reusable snippet */
const defaultBranchLink = (
  <LinkButton uri="https://help.github.com/articles/setting-the-default-branch/">
    default branch
  </LinkButton>
)

/** Given some branches and a start point, return the proper branch */
function getBranchForStartPoint(
  startPoint: StartPoint,
  branchInfo: {
    readonly defaultBranch: Branch | null
    readonly upstreamDefaultBranch: Branch | null
  }
) {
  return startPoint === StartPoint.UpstreamDefaultBranch
    ? branchInfo.upstreamDefaultBranch
    : startPoint === StartPoint.DefaultBranch
    ? branchInfo.defaultBranch
    : null
}

export const CreateBranch = withTranslation()(
  CreateBranchInternal
) as unknown as React.ComponentClass<ICreateBranchProps>
