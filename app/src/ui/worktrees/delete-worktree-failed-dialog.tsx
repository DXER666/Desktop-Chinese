import * as React from 'react'
import * as Path from 'path'

import { Dialog, DialogContent, DialogFooter } from '../dialog'
import { Ref } from '../lib/ref'
import { OkCancelButtonGroup } from '../dialog/ok-cancel-button-group'
import { Repository } from '../../models/repository'
import { getUnderlyingError, isRawGitError } from '../app-error'
import { Terminal } from '../terminal'
import { WorktreeEntry } from '../../models/worktree'
import { withTranslation, WithTranslation } from 'react-i18next'

interface IDeleteWorktreeFailedDialogProps {
  readonly repository: Repository
  readonly worktreePath: string
  readonly onDeleteWorktree: (
    repository: Repository,
    worktreePath: string,
    force: boolean
  ) => Promise<void>
  readonly onSwitchToWorktree: (
    repository: Repository,
    worktree: WorktreeEntry
  ) => Promise<void>
  readonly error: Error
  readonly originalWorktree: WorktreeEntry | null
  readonly onDismissed: () => void
}

interface IDeleteWorktreeFailedDialogState {
  readonly isDeleting: boolean
}

class DeleteWorktreeFailedDialogInternal extends React.Component<
  IDeleteWorktreeFailedDialogProps & WithTranslation,
  IDeleteWorktreeFailedDialogState
> {
  public constructor(
    props: IDeleteWorktreeFailedDialogProps & WithTranslation
  ) {
    super(props)

    this.state = {
      isDeleting: false,
    }
  }

  public render() {
    const { t } = this.props
    const name = Path.basename(this.props.worktreePath)

    return (
      <Dialog
        id="delete-worktree-failed"
        title={
          __DARWIN__
            ? t('worktree.deleteFailedTitleDarwin', 'Delete Worktree Failed')
            : t('worktree.deleteFailedTitleOther', 'Delete worktree failed')
        }
        type="error"
        onSubmit={this.onSubmit}
        onDismissed={this.onDismissed}
        disabled={this.state.isDeleting}
        loading={this.state.isDeleting}
        role="alertdialog"
        ariaDescribedBy="delete-worktree-failed-message"
      >
        <DialogContent>
          <div id="delete-worktree-failed-message">
            <p>
              {t('worktree.deleteFailedPrefix', 'Deleting the worktree')}{' '}
              <Ref>{name}</Ref> {t('worktree.deleteFailedSuffix', 'failed.')}
            </p>
            {this.renderErrorMessage()}
            <p>
              {t(
                'worktree.forceDeleteQuestionPrefix',
                'Would you like to forcefully delete the worktree'
              )}{' '}
              <Ref>{name}</Ref>?
            </p>
          </div>
        </DialogContent>
        <DialogFooter>
          <OkCancelButtonGroup
            destructive={true}
            okButtonText={t('worktree.forceDeleteButton', 'Forcefully delete')}
          />
        </DialogFooter>
      </Dialog>
    )
  }

  private renderErrorMessage() {
    const e = getUnderlyingError(this.props.error)

    if (isRawGitError(e)) {
      return <Terminal terminalOutput={e.message} rows={8} cols={80} />
    }

    return <p>{e.toString()}</p>
  }

  private onDismissed = () => {
    const { originalWorktree, repository } = this.props

    if (originalWorktree !== null) {
      this.props.onSwitchToWorktree(repository, originalWorktree)
    }

    this.props.onDismissed()
  }

  private onSubmit = async () => {
    this.setState({ isDeleting: true })
    await this.props.onDeleteWorktree(
      this.props.repository,
      this.props.worktreePath,
      true
    )
    this.props.onDismissed()
  }
}

export const DeleteWorktreeFailedDialog = withTranslation()(
  DeleteWorktreeFailedDialogInternal
) as unknown as React.ComponentClass<IDeleteWorktreeFailedDialogProps>
