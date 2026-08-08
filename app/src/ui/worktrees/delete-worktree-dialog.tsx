import * as React from 'react'
import * as Path from 'path'

import { Dialog, DialogContent, DialogFooter } from '../dialog'
import { Ref } from '../lib/ref'
import { OkCancelButtonGroup } from '../dialog/ok-cancel-button-group'
import { Repository } from '../../models/repository'
import { Checkbox, CheckboxValue } from '../lib/checkbox'
import { withTranslation, WithTranslation } from 'react-i18next'

interface IDeleteWorktreeDialogProps {
  readonly repository: Repository
  readonly worktreePath: string
  readonly askForConfirmationOnWorktreeRemoval: boolean
  readonly onDeleteWorktree: (
    repository: Repository,
    worktreePath: string
  ) => Promise<void>
  readonly onConfirmWorktreeRemovalChanged: (value: boolean) => void
  readonly onDismissed: () => void
}

interface IDeleteWorktreeDialogState {
  readonly isDeleting: boolean
  readonly confirmWorktreeRemoval: boolean
}

class DeleteWorktreeDialogInternal extends React.Component<
  IDeleteWorktreeDialogProps & WithTranslation,
  IDeleteWorktreeDialogState
> {
  public constructor(props: IDeleteWorktreeDialogProps & WithTranslation) {
    super(props)

    this.state = {
      isDeleting: false,
      confirmWorktreeRemoval: props.askForConfirmationOnWorktreeRemoval,
    }
  }

  public render() {
    const { t } = this.props
    const name = Path.basename(this.props.worktreePath)

    return (
      <Dialog
        id="delete-worktree"
        title={
          __DARWIN__
            ? t('worktree.deleteTitleDarwin', 'Delete Worktree')
            : t('worktree.deleteTitleOther', 'Delete worktree')
        }
        type="warning"
        onSubmit={this.onSubmit}
        onDismissed={this.props.onDismissed}
        disabled={this.state.isDeleting}
        loading={this.state.isDeleting}
        role="alertdialog"
        ariaDescribedBy="delete-worktree-confirmation"
      >
        <DialogContent>
          <p id="delete-worktree-confirmation">
            {t(
              'worktree.deleteConfirmPrefix',
              'Are you sure you want to delete the worktree'
            )}{' '}
            <Ref>{name}</Ref>?
          </p>
          <Checkbox
            label={t(
              'worktree.doNotShowAgainLabel',
              'Do not show this message again'
            )}
            value={
              this.state.confirmWorktreeRemoval
                ? CheckboxValue.Off
                : CheckboxValue.On
            }
            onChange={this.onConfirmWorktreeRemovalChanged}
          />
        </DialogContent>
        <DialogFooter>
          <OkCancelButtonGroup
            destructive={true}
            okButtonText={t('worktree.deleteOkButton', 'Delete')}
          />
        </DialogFooter>
      </Dialog>
    )
  }

  private onConfirmWorktreeRemovalChanged = (
    event: React.FormEvent<HTMLInputElement>
  ) => {
    const value = !event.currentTarget.checked
    this.setState({ confirmWorktreeRemoval: value })
  }

  private onSubmit = async () => {
    this.setState({ isDeleting: true })

    this.props.onConfirmWorktreeRemovalChanged(
      this.state.confirmWorktreeRemoval
    )

    await this.props.onDeleteWorktree(
      this.props.repository,
      this.props.worktreePath
    )
    this.props.onDismissed()
  }
}

export const DeleteWorktreeDialog = withTranslation()(
  DeleteWorktreeDialogInternal
) as unknown as React.ComponentClass<IDeleteWorktreeDialogProps>
