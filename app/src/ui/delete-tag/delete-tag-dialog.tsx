import * as React from 'react'

import { Dispatcher } from '../dispatcher'
import { Repository } from '../../models/repository'
import { Dialog, DialogContent, DialogFooter } from '../dialog'
import { Ref } from '../lib/ref'
import { OkCancelButtonGroup } from '../dialog/ok-cancel-button-group'
import { withTranslation, WithTranslation } from 'react-i18next'

interface IDeleteTagProps {
  readonly dispatcher: Dispatcher
  readonly repository: Repository
  readonly tagName: string
  readonly onDismissed: () => void
}

interface IDeleteTagState {
  readonly isDeleting: boolean
}

class DeleteTagInternal extends React.Component<
  IDeleteTagProps & WithTranslation,
  IDeleteTagState
> {
  public constructor(props: IDeleteTagProps & WithTranslation) {
    super(props)

    this.state = {
      isDeleting: false,
    }
  }

  public render() {
    const { t } = this.props
    return (
      <Dialog
        id="delete-tag"
        title={
          __DARWIN__
            ? t('deleteTag.titleDarwin', 'Delete Tag')
            : t('deleteTag.titleOther', 'Delete tag')
        }
        type="warning"
        onSubmit={this.DeleteTag}
        onDismissed={this.props.onDismissed}
        disabled={this.state.isDeleting}
        loading={this.state.isDeleting}
        role="alertdialog"
        ariaDescribedBy="delete-tag-confirmation"
      >
        <DialogContent>
          <p id="delete-tag-confirmation">
            {t(
              'deleteTag.confirmPrefix',
              'Are you sure you want to delete the tag'
            )}{' '}
            <Ref>{this.props.tagName}</Ref>?
          </p>
        </DialogContent>
        <DialogFooter>
          <OkCancelButtonGroup
            destructive={true}
            okButtonText={t('deleteTag.okButton', 'Delete')}
          />
        </DialogFooter>
      </Dialog>
    )
  }

  private DeleteTag = async () => {
    const { dispatcher, repository, tagName } = this.props

    this.setState({ isDeleting: true })

    await dispatcher.deleteTag(repository, tagName)
    this.props.onDismissed()
  }
}

export const DeleteTag = withTranslation()(
  DeleteTagInternal
) as unknown as React.ComponentClass<IDeleteTagProps>
