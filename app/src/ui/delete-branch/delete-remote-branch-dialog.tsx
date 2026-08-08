import * as React from 'react'

import { Dispatcher } from '../dispatcher'
import { Repository } from '../../models/repository'
import { Branch } from '../../models/branch'
import { Dialog, DialogContent, DialogFooter } from '../dialog'
import { Ref } from '../lib/ref'
import { OkCancelButtonGroup } from '../dialog/ok-cancel-button-group'
import { withTranslation, WithTranslation } from 'react-i18next'

interface IDeleteRemoteBranchProps {
  readonly dispatcher: Dispatcher
  readonly repository: Repository
  readonly branch: Branch
  readonly onDismissed: () => void
  readonly onDeleted: (repository: Repository) => void
}
interface IDeleteRemoteBranchState {
  readonly isDeleting: boolean
}

class DeleteRemoteBranchInternal extends React.Component<
  IDeleteRemoteBranchProps & WithTranslation,
  IDeleteRemoteBranchState
> {
  public constructor(props: IDeleteRemoteBranchProps & WithTranslation) {
    super(props)

    this.state = {
      isDeleting: false,
    }
  }

  public render() {
    const { t } = this.props
    return (
      <Dialog
        id="delete-branch"
        title={
          __DARWIN__
            ? t('deleteBranch.deleteRemoteTitleDarwin', 'Delete Remote Branch')
            : t('deleteBranch.deleteRemoteTitleOther', 'Delete remote branch')
        }
        type="warning"
        onSubmit={this.deleteBranch}
        onDismissed={this.props.onDismissed}
        disabled={this.state.isDeleting}
        loading={this.state.isDeleting}
        role="alertdialog"
        ariaDescribedBy="delete-branch-confirmation-message"
      >
        <DialogContent>
          <div id="delete-branch-confirmation-message">
            <p>
              {t(
                'deleteBranch.deleteRemoteBranchPrefix',
                'Delete remote branch'
              )}{' '}
              <Ref>{this.props.branch.name}</Ref>?
            </p>
            <p>
              {t('deleteBranch.cannotUndo', 'This action cannot be undone.')}
            </p>

            <p>
              {t(
                'deleteBranch.remoteBranchImpactWarning',
                'This branch does not exist locally. Deleting it may impact others collaborating on this branch.'
              )}
            </p>
          </div>
        </DialogContent>
        <DialogFooter>
          <OkCancelButtonGroup
            destructive={true}
            okButtonText={t('deleteBranch.okButton', 'Delete')}
          />
        </DialogFooter>
      </Dialog>
    )
  }

  private deleteBranch = async () => {
    const { dispatcher, repository, branch } = this.props

    this.setState({ isDeleting: true })

    await dispatcher.deleteRemoteBranch(repository, branch)
    this.props.onDeleted(repository)

    this.props.onDismissed()
  }
}

export const DeleteRemoteBranch = withTranslation()(
  DeleteRemoteBranchInternal
) as unknown as React.ComponentClass<IDeleteRemoteBranchProps>
