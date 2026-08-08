import * as React from 'react'
import * as Path from 'path'

import { Repository } from '../../models/repository'
import { Dispatcher } from '../dispatcher'
import { Dialog, DialogContent, DialogFooter } from '../dialog'
import { TextBox } from '../lib/text-box'
import { OkCancelButtonGroup } from '../dialog/ok-cancel-button-group'
import { withTranslation, WithTranslation } from 'react-i18next'

interface IRenameWorktreeDialogProps {
  readonly repository: Repository
  readonly worktreePath: string
  readonly dispatcher: Dispatcher
  readonly onDismissed: () => void
}

interface IRenameWorktreeDialogState {
  readonly newName: string
  readonly renaming: boolean
}

class RenameWorktreeDialogInternal extends React.Component<
  IRenameWorktreeDialogProps & WithTranslation,
  IRenameWorktreeDialogState
> {
  public constructor(props: IRenameWorktreeDialogProps & WithTranslation) {
    super(props)

    this.state = {
      newName: Path.basename(props.worktreePath),
      renaming: false,
    }
  }

  private onNameChanged = (newName: string) => {
    this.setState({ newName })
  }

  private onSubmit = async () => {
    const { worktreePath, repository, onDismissed } = this.props
    const { newName } = this.state
    const newPath = Path.join(Path.dirname(worktreePath), newName)

    this.setState({ renaming: true })

    const success = await this.props.dispatcher.moveWorktree(
      repository,
      worktreePath,
      newPath
    )

    this.setState({ renaming: false })

    if (success) {
      onDismissed()
    }
  }

  public render() {
    const { t } = this.props
    const currentName = Path.basename(this.props.worktreePath)
    const disabled =
      this.state.newName.length === 0 ||
      this.state.newName === currentName ||
      this.state.renaming

    return (
      <Dialog
        id="rename-worktree"
        title={
          __DARWIN__
            ? t('worktree.renameTitleDarwin', 'Rename Worktree')
            : t('worktree.renameTitleOther', 'Rename worktree')
        }
        loading={this.state.renaming}
        onSubmit={this.onSubmit}
        onDismissed={this.props.onDismissed}
      >
        <DialogContent>
          <TextBox
            label={t('worktree.nameLabel', 'Name')}
            value={this.state.newName}
            onValueChanged={this.onNameChanged}
          />
        </DialogContent>

        <DialogFooter>
          <OkCancelButtonGroup
            okButtonText={t(
              'worktree.renameOkButton',
              'Rename {{currentName}}',
              {
                currentName,
              }
            )}
            okButtonDisabled={disabled}
          />
        </DialogFooter>
      </Dialog>
    )
  }
}

export const RenameWorktreeDialog = withTranslation()(
  RenameWorktreeDialogInternal
) as unknown as React.ComponentClass<IRenameWorktreeDialogProps>
