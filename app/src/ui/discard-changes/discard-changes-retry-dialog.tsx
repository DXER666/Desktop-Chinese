import * as React from 'react'
import { Dialog, DialogContent, DialogFooter } from '../dialog'
import { OkCancelButtonGroup } from '../dialog/ok-cancel-button-group'
import { Dispatcher } from '../dispatcher'
import { getTrashNameLabel } from '../lib/context-menu'
import { RetryAction } from '../../models/retry-actions'
import { Checkbox, CheckboxValue } from '../lib/checkbox'
import { withTranslation, WithTranslation } from 'react-i18next'

interface IDiscardChangesRetryDialogProps {
  readonly dispatcher: Dispatcher
  readonly retryAction: RetryAction
  readonly onDismissed: () => void
  readonly onConfirmDiscardChangesChanged: (optOut: boolean) => void
}

interface IDiscardChangesRetryDialogState {
  readonly retrying: boolean
  readonly confirmDiscardChanges: boolean
}

class DiscardChangesRetryDialogInternal extends React.Component<
  IDiscardChangesRetryDialogProps & WithTranslation,
  IDiscardChangesRetryDialogState
> {
  public constructor(props: IDiscardChangesRetryDialogProps & WithTranslation) {
    super(props)
    this.state = { retrying: false, confirmDiscardChanges: true }
  }

  public render() {
    const { t } = this.props
    const { retrying } = this.state

    return (
      <Dialog
        title={
          __DARWIN__
            ? t(
                'discardChanges.retryTitleDarwin',
                'Discarded Changes Will Be Unrecoverable'
              )
            : t(
                'discardChanges.retryTitleOther',
                'Discarded changes will be unrecoverable'
              )
        }
        id="discard-changes-retry"
        loading={retrying}
        disabled={retrying}
        onDismissed={this.props.onDismissed}
        onSubmit={this.onSubmit}
        type="error"
      >
        <DialogContent>
          <p>
            {t(
              'discardChanges.failedToDiscardPrefix',
              'Failed to discard changes to'
            )}{' '}
            {getTrashNameLabel()}.
          </p>
          <div>
            {t('discardChanges.commonReasons', 'Common reasons are:')}
            <ul>
              <li>
                {t(
                  'discardChanges.reasonImmediateDelete',
                  'The {{trashName}} is configured to delete items immediately.',
                  { trashName: getTrashNameLabel() }
                )}
              </li>
              <li>
                {t(
                  'discardChanges.reasonRestrictedAccess',
                  'Restricted access to move the file(s).'
                )}
              </li>
            </ul>
          </div>
          <p>
            {t(
              'discardChanges.unrecoverableFromTrash',
              'These changes will be unrecoverable from the {{trashName}}.',
              { trashName: getTrashNameLabel() }
            )}
          </p>
          {this.renderConfirmDiscardChanges()}
        </DialogContent>
        {this.renderFooter()}
      </Dialog>
    )
  }

  private renderConfirmDiscardChanges() {
    const { t } = this.props
    return (
      <Checkbox
        label={t(
          'discardChanges.doNotShowAgainLabel',
          'Do not show this message again'
        )}
        value={
          this.state.confirmDiscardChanges
            ? CheckboxValue.Off
            : CheckboxValue.On
        }
        onChange={this.onConfirmDiscardChangesChanged}
      />
    )
  }

  private renderFooter() {
    const { t } = this.props
    return (
      <DialogFooter>
        <OkCancelButtonGroup
          okButtonText={
            __DARWIN__
              ? t(
                  'discardChanges.permanentlyDiscardDarwin',
                  'Permanently Discard Changes'
                )
              : t(
                  'discardChanges.permanentlyDiscardOther',
                  'Permanently discard changes'
                )
          }
          okButtonTitle={t(
            'discardChanges.okButtonTitle',
            'This will discard changes and they will be unrecoverable.'
          )}
          cancelButtonText={t('discardChanges.cancelButton', 'Cancel')}
          destructive={true}
        />
      </DialogFooter>
    )
  }

  private onConfirmDiscardChangesChanged = (
    event: React.FormEvent<HTMLInputElement>
  ) => {
    const value = !event.currentTarget.checked

    this.setState({ confirmDiscardChanges: value })
  }

  private onSubmit = async () => {
    const { dispatcher, retryAction } = this.props

    this.setState({ retrying: true })

    await dispatcher.performRetry(retryAction)

    this.props.onConfirmDiscardChangesChanged(this.state.confirmDiscardChanges)
    this.props.onDismissed()
  }
}

export const DiscardChangesRetryDialog = withTranslation()(
  DiscardChangesRetryDialogInternal
) as unknown as React.ComponentClass<IDiscardChangesRetryDialogProps>
