import React from 'react'
import { Trans, withTranslation, WithTranslation } from 'react-i18next'
import { Branch } from '../../../models/branch'
import { ComputedAction } from '../../../models/computed-action'
import { RebasePreview } from '../../../models/rebase'
import { ActionStatusIcon } from '../../lib/action-status-icon'
import { updateRebasePreview, getMergeOptions } from '../../lib/update-branch'
import {
  ChooseBranchDialog,
  IBaseChooseBranchDialogProps,
  canStartOperation,
} from './base-choose-branch-dialog'
import { truncateWithEllipsis } from '../../../lib/truncate-with-ellipsis'

interface IRebaseChooseBranchDialogState {
  readonly rebasePreview: RebasePreview | null
  readonly selectedBranch: Branch | null
}

class RebaseChooseBranchDialogInternal extends React.Component<
  IBaseChooseBranchDialogProps & WithTranslation,
  IRebaseChooseBranchDialogState
> {
  public constructor(props: IBaseChooseBranchDialogProps & WithTranslation) {
    super(props)

    this.state = {
      selectedBranch: null,
      rebasePreview: null,
    }
  }

  private start = () => {
    if (!this.canStart()) {
      return
    }

    const { selectedBranch, rebasePreview } = this.state
    const { repository, currentBranch, dispatcher } = this.props

    if (
      selectedBranch === null ||
      rebasePreview === null ||
      rebasePreview.kind !== ComputedAction.Clean
    ) {
      return
    }

    dispatcher.startRebase(
      repository,
      selectedBranch,
      currentBranch,
      rebasePreview.commitsAhead
    )
  }

  private canStart = (): boolean => {
    const { currentBranch } = this.props
    const { selectedBranch, rebasePreview } = this.state
    const commitCount =
      rebasePreview?.kind === ComputedAction.Clean
        ? rebasePreview.commitsBehind.length
        : undefined
    return canStartOperation(
      selectedBranch,
      currentBranch,
      commitCount,
      rebasePreview?.kind
    )
  }

  private onSelectionChanged = (selectedBranch: Branch | null) => {
    this.setState({ selectedBranch })

    if (selectedBranch === null) {
      this.setState({ rebasePreview: null })
      return
    }

    this.updateStatus(selectedBranch)
  }

  private getSubmitButtonToolTip = () => {
    const { t } = this.props
    const { currentBranch } = this.props
    const { selectedBranch, rebasePreview } = this.state

    const selectedBranchIsCurrentBranch =
      selectedBranch !== null &&
      currentBranch !== null &&
      selectedBranch.name === currentBranch.name

    const currentBranchIsBehindSelectedBranch =
      rebasePreview?.kind === ComputedAction.Clean
        ? rebasePreview.commitsBehind.length > 0
        : false

    return selectedBranchIsCurrentBranch
      ? t(
          'chooseBranchDialog.rebaseTooltipSelfTarget',
          'Cannot rebase {{branchName}} onto itself',
          {
            branchName: selectedBranch?.name ?? '',
          }
        )
      : !currentBranchIsBehindSelectedBranch
      ? t(
          'chooseBranchDialog.rebaseTooltipUpToDate',
          '{{branchName}} is already up to date with the target branch',
          {
            branchName: currentBranch?.name ?? '',
          }
        )
      : undefined
  }

  private getDialogTitle = () => {
    const { t } = this.props
    const truncatedName = truncateWithEllipsis(
      this.props.currentBranch.name,
      40
    )
    const parts = t('chooseBranchDialog.rebaseTitle', 'Rebase {{branchName}}', {
      branchName: truncatedName,
      interpolation: { escapeValue: false },
    }).split(/(\{\{.*?\}\})/)
    return (
      <>
        {parts.map((part, i) =>
          part === `{{branchName}}` ? (
            <strong key={i}>{truncatedName}</strong>
          ) : (
            part
          )
        )}
      </>
    )
  }

  private updateStatus = async (baseBranch: Branch) => {
    const { currentBranch: targetBranch, repository } = this.props
    updateRebasePreview(baseBranch, targetBranch, repository, rebasePreview => {
      this.setState({ rebasePreview })
    })
  }

  private renderStatusPreviewMessage(): JSX.Element | null {
    const { rebasePreview, selectedBranch: baseBranch } = this.state
    if (rebasePreview == null || baseBranch == null) {
      return null
    }

    const { currentBranch } = this.props

    if (rebasePreview.kind === ComputedAction.Loading) {
      return this.renderLoadingRebaseMessage()
    }
    if (rebasePreview.kind === ComputedAction.Clean) {
      return this.renderCleanRebaseMessage(
        currentBranch,
        baseBranch,
        rebasePreview.commitsAhead.length,
        rebasePreview.commitsBehind.length
      )
    }

    if (rebasePreview.kind === ComputedAction.Invalid) {
      return this.renderInvalidRebaseMessage()
    }

    return null
  }

  private renderLoadingRebaseMessage() {
    const { t } = this.props
    return (
      <>
        {t(
          'chooseBranchDialog.rebaseCheckingAutomatic',
          'Checking for ability to rebase automatically…'
        )}
      </>
    )
  }

  private renderInvalidRebaseMessage() {
    const { t } = this.props
    return (
      <>
        {t(
          'chooseBranchDialog.rebaseInvalid',
          'Unable to start rebase. Check you have chosen a valid branch.'
        )}
      </>
    )
  }

  private renderCleanRebaseMessage(
    currentBranch: Branch,
    baseBranch: Branch,
    commitsAheadCount: number,
    commitsBehindCount: number
  ) {
    const { t } = this.props
    if (commitsBehindCount > 0 && commitsAheadCount <= 0) {
      const count = commitsBehindCount
      return (
        <Trans
          i18nKey={
            count === 1
              ? 'chooseBranchDialog.rebaseFastForwardSingular'
              : 'chooseBranchDialog.rebaseFastForwardPlural'
          }
          t={t}
          defaults={
            count === 1
              ? 'This will fast-forward <currentBranch></currentBranch> by <commitCount>1 commit</commitCount> to match <baseBranch></baseBranch>'
              : 'This will fast-forward <currentBranch></currentBranch> by <commitCount>{{count}} commits</commitCount> to match <baseBranch></baseBranch>'
          }
          values={{ count }}
          components={{
            currentBranch: <strong>{currentBranch.name}</strong>,
            commitCount: <strong />,
            baseBranch: <strong>{baseBranch.name}</strong>,
          }}
        />
      )
    }

    if (commitsBehindCount > 0 && commitsAheadCount > 0) {
      const count = commitsAheadCount
      return (
        <Trans
          i18nKey={
            count === 1
              ? 'chooseBranchDialog.rebaseUpdateSingular'
              : 'chooseBranchDialog.rebaseUpdatePlural'
          }
          t={t}
          defaults={
            count === 1
              ? 'This will update <currentBranch></currentBranch> by applying its <commitCount>1 commit</commitCount> on top of <baseBranch></baseBranch>'
              : 'This will update <currentBranch></currentBranch> by applying its <commitCount>{{count}} commits</commitCount> on top of <baseBranch></baseBranch>'
          }
          values={{ count }}
          components={{
            currentBranch: <strong>{currentBranch.name}</strong>,
            commitCount: <strong />,
            baseBranch: <strong>{baseBranch.name}</strong>,
          }}
        />
      )
    }

    return (
      <Trans
        i18nKey="chooseBranchDialog.rebaseAlreadyUpToDate"
        t={t}
        defaults="<currentBranch></currentBranch> is already up to date with <baseBranch></baseBranch>"
        components={{
          currentBranch: <strong>{currentBranch.name}</strong>,
          baseBranch: <strong>{baseBranch.name}</strong>,
        }}
      />
    )
  }

  private renderStatusPreview() {
    return (
      <>
        <ActionStatusIcon
          status={this.state.rebasePreview}
          classNamePrefix="merge-status"
        />
        <p className="merge-info" id="merge-status-preview">
          {this.renderStatusPreviewMessage()}
        </p>
      </>
    )
  }

  public render() {
    void getMergeOptions
    return (
      <ChooseBranchDialog
        {...this.props}
        start={this.start}
        selectedBranch={this.state.selectedBranch}
        canStartOperation={this.canStart()}
        dialogTitle={this.getDialogTitle()}
        submitButtonTooltip={this.getSubmitButtonToolTip()}
        onSelectionChanged={this.onSelectionChanged}
      >
        {this.renderStatusPreview()}
      </ChooseBranchDialog>
    )
  }
}

export const RebaseChooseBranchDialog = withTranslation()(
  RebaseChooseBranchDialogInternal
) as unknown as React.ComponentClass<IBaseChooseBranchDialogProps>
