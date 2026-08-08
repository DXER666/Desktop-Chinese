import React from 'react'
import { Trans, withTranslation, WithTranslation } from 'react-i18next'
import { getAheadBehind, revSymmetricDifference } from '../../../lib/git'
import { determineMergeability } from '../../../lib/git/merge-tree'
import { Branch } from '../../../models/branch'
import { ComputedAction } from '../../../models/computed-action'
import { MergeTreeResult } from '../../../models/merge'
import { MultiCommitOperationKind } from '../../../models/multi-commit-operation'
import { PopupType } from '../../../models/popup'
import { ActionStatusIcon } from '../../lib/action-status-icon'
import {
  ChooseBranchDialog,
  IBaseChooseBranchDialogProps,
  canStartOperation,
} from './base-choose-branch-dialog'
import { truncateWithEllipsis } from '../../../lib/truncate-with-ellipsis'
import { formatNumber } from '../../../lib/format-number'
import { getMergeOptions } from '../../lib/update-branch'

interface IMergeChooseBranchDialogState {
  readonly commitCount: number
  readonly mergeStatus: MergeTreeResult | null
  readonly selectedBranch: Branch | null
}

class MergeChooseBranchDialogInternal extends React.Component<
  IBaseChooseBranchDialogProps & WithTranslation,
  IMergeChooseBranchDialogState
> {
  public constructor(props: IBaseChooseBranchDialogProps & WithTranslation) {
    super(props)

    this.state = {
      selectedBranch: null,
      commitCount: 0,
      mergeStatus: null,
    }
  }

  private start = () => {
    if (!this.canStart()) {
      return
    }

    const { selectedBranch, mergeStatus } = this.state
    const { operation, dispatcher, repository } = this.props
    if (!selectedBranch) {
      return
    }

    dispatcher.mergeBranch(
      repository,
      selectedBranch,
      mergeStatus,
      operation === MultiCommitOperationKind.Squash
    )

    dispatcher.closePopup(PopupType.MultiCommitOperation)
  }

  private canStart = (): boolean => {
    const { currentBranch } = this.props
    const { selectedBranch, commitCount, mergeStatus } = this.state

    return canStartOperation(
      selectedBranch,
      currentBranch,
      commitCount,
      mergeStatus?.kind
    )
  }

  private onSelectionChanged = (selectedBranch: Branch | null) => {
    if (selectedBranch === null) {
      this.setState({ selectedBranch, commitCount: 0, mergeStatus: null })
    } else {
      this.setState(
        {
          selectedBranch,
          commitCount: 0,
          mergeStatus: { kind: ComputedAction.Loading },
        },
        () => this.updateStatus(selectedBranch)
      )
    }
  }

  private getDialogTitle = () => {
    const { t } = this.props
    const truncatedName = truncateWithEllipsis(
      this.props.currentBranch.name,
      40
    )
    const isSquash = this.props.operation === MultiCommitOperationKind.Squash
    return (
      <>
        {isSquash && (
          <>{t('chooseBranchDialog.squashMergeTitlePrefix', 'Squash and ')}</>
        )}
        {t('chooseBranchDialog.mergeTitle', 'Merge into {{branchName}}', {
          branchName: truncatedName,
          interpolation: { escapeValue: false },
        })
          .split(/(\{\{.*?\}\})/)
          .map((part, i) => {
            if (part === `{{branchName}}`) {
              return <strong key={i}>{truncatedName}</strong>
            }
            return part
          })}
      </>
    )
  }

  private updateStatus = async (branch: Branch) => {
    const { currentBranch, repository } = this.props

    const mergeStatus = await determineMergeability(
      repository,
      currentBranch,
      branch
    ).catch<MergeTreeResult>(e => {
      log.error('Failed determining mergeability', e)
      return { kind: ComputedAction.Clean }
    })

    if (this.state.selectedBranch?.tip.sha !== branch.tip.sha) {
      return
    }

    if (mergeStatus.kind === ComputedAction.Invalid) {
      this.setState({ mergeStatus })
      return
    }

    const range = revSymmetricDifference('', branch.name)
    const aheadBehind = await getAheadBehind(repository, range)
    const commitCount = aheadBehind ? aheadBehind.behind : 0

    if (this.state.selectedBranch.tip.sha !== branch.tip.sha) {
      return
    }

    this.setState({ commitCount, mergeStatus })
  }

  private renderStatusPreviewMessage(): JSX.Element | null {
    const { mergeStatus, selectedBranch: branch } = this.state
    const { currentBranch } = this.props

    if (mergeStatus === null || branch === null) {
      return null
    }

    if (mergeStatus.kind === ComputedAction.Loading) {
      return this.renderLoadingMergeMessage()
    }

    if (mergeStatus.kind === ComputedAction.Clean) {
      return this.renderCleanMergeMessage(
        branch,
        currentBranch,
        this.state.commitCount
      )
    }

    if (mergeStatus.kind === ComputedAction.Invalid) {
      return this.renderInvalidMergeMessage()
    }

    return this.renderConflictedMergeMessage(
      branch,
      currentBranch,
      mergeStatus.conflictedFiles
    )
  }

  private renderLoadingMergeMessage() {
    const { t } = this.props
    return (
      <>
        {t(
          'chooseBranchDialog.mergeCheckingAutomatic',
          'Checking for ability to merge automatically…'
        )}
      </>
    )
  }

  private renderCleanMergeMessage(
    branch: Branch,
    currentBranch: Branch,
    commitCount: number
  ) {
    const { t } = this.props
    if (commitCount === 0) {
      return (
        <Trans
          i18nKey="chooseBranchDialog.mergeAlreadyUpToDate"
          t={t}
          defaults="<currentBranch></currentBranch> is already up to date with <targetBranch></targetBranch>"
          components={{
            currentBranch: <strong>{currentBranch.name}</strong>,
            targetBranch: <strong>{branch.name}</strong>,
          }}
        />
      )
    }

    const count = formatNumber(commitCount)
    return (
      <Trans
        i18nKey={
          commitCount === 1
            ? 'chooseBranchDialog.mergeCleanSingular'
            : 'chooseBranchDialog.mergeCleanPlural'
        }
        t={t}
        defaults={
          commitCount === 1
            ? 'This will merge <commitCount>1 commit</commitCount> from <fromBranch></fromBranch> into <intoBranch></intoBranch>'
            : 'This will merge <commitCount>{{count}} commits</commitCount> from <fromBranch></fromBranch> into <intoBranch></intoBranch>'
        }
        values={{ count }}
        components={{
          commitCount: <strong />,
          fromBranch: <strong>{branch.name}</strong>,
          intoBranch: <strong>{currentBranch.name}</strong>,
        }}
      />
    )
  }

  private renderInvalidMergeMessage() {
    const { t } = this.props
    return (
      <React.Fragment>
        {t(
          'chooseBranchDialog.mergeInvalid',
          'This repository contains unrelated histories. No merge is possible.'
        )}
      </React.Fragment>
    )
  }

  private renderConflictedMergeMessage(
    branch: Branch,
    currentBranch: Branch,
    count: number
  ) {
    const { t } = this.props
    const formattedCount = formatNumber(count)
    return (
      <Trans
        i18nKey={
          count === 1
            ? 'chooseBranchDialog.mergeConflictsSingular'
            : 'chooseBranchDialog.mergeConflictsPlural'
        }
        t={t}
        defaults={
          count === 1
            ? 'There will be <fileCount>1 conflicted file</fileCount> when merging <fromBranch></fromBranch> into <intoBranch></intoBranch>'
            : 'There will be <fileCount>{{count}} conflicted files</fileCount> when merging <fromBranch></fromBranch> into <intoBranch></intoBranch>'
        }
        values={{ count: formattedCount }}
        components={{
          fileCount: <strong />,
          fromBranch: <strong>{branch.name}</strong>,
          intoBranch: <strong>{currentBranch.name}</strong>,
        }}
      />
    )
  }

  private renderStatusPreview() {
    return (
      <>
        <ActionStatusIcon
          status={this.state.mergeStatus}
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
        onSelectionChanged={this.onSelectionChanged}
      >
        {this.renderStatusPreview()}
      </ChooseBranchDialog>
    )
  }
}

export const MergeChooseBranchDialog = withTranslation()(
  MergeChooseBranchDialogInternal
) as unknown as React.ComponentClass<IBaseChooseBranchDialogProps>
