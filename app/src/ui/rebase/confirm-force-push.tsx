import * as React from 'react'

import { Repository } from '../../models/repository'
import { Checkbox, CheckboxValue } from '../lib/checkbox'
import { Dispatcher } from '../dispatcher'
import { DialogFooter, DialogContent, Dialog } from '../dialog'
import { Ref } from '../lib/ref'
import { OkCancelButtonGroup } from '../dialog/ok-cancel-button-group'
import { withTranslation, WithTranslation } from 'react-i18next'

interface IConfirmForcePushProps {
  readonly dispatcher: Dispatcher
  readonly repository: Repository
  readonly upstreamBranch: string
  readonly askForConfirmationOnForcePush: boolean
  readonly onDismissed: () => void
}

interface IConfirmForcePushState {
  readonly isLoading: boolean
  readonly askForConfirmationOnForcePush: boolean
}

class ConfirmForcePushInternal extends React.Component<
  IConfirmForcePushProps & WithTranslation,
  IConfirmForcePushState
> {
  public constructor(props: IConfirmForcePushProps & WithTranslation) {
    super(props)

    this.state = {
      isLoading: false,
      askForConfirmationOnForcePush: props.askForConfirmationOnForcePush,
    }
  }

  public render() {
    const { t } = this.props
    return (
      <Dialog
        title={t(
          'forcePush.confirmTitle',
          'Are you sure you want to force push?'
        )}
        dismissDisabled={this.state.isLoading}
        onDismissed={this.props.onDismissed}
        onSubmit={this.onForcePush}
        type="warning"
      >
        <DialogContent>
          <p>
            {t(
              'forcePush.descriptionPrefix',
              'A force push will rewrite history on'
            )}{' '}
            <Ref>{this.props.upstreamBranch}</Ref>.{' '}
            {t(
              'forcePush.descriptionSuffix',
              'Any collaborators working on this branch will need to reset their own local branch to match the history of the remote.'
            )}
          </p>
          <div>
            <Checkbox
              label={t(
                'forcePush.doNotShowAgainLabel',
                'Do not show this message again'
              )}
              value={
                this.state.askForConfirmationOnForcePush
                  ? CheckboxValue.Off
                  : CheckboxValue.On
              }
              onChange={this.onAskForConfirmationOnForcePushChanged}
            />
          </div>
        </DialogContent>
        <DialogFooter>
          <OkCancelButtonGroup
            destructive={true}
            okButtonText={t('forcePush.imSureButton', "I'm sure")}
          />
        </DialogFooter>
      </Dialog>
    )
  }

  private onAskForConfirmationOnForcePushChanged = (
    event: React.FormEvent<HTMLInputElement>
  ) => {
    const value = !event.currentTarget.checked

    this.setState({ askForConfirmationOnForcePush: value })
  }

  private onForcePush = async () => {
    this.props.dispatcher.setConfirmForcePushSetting(
      this.state.askForConfirmationOnForcePush
    )
    this.props.onDismissed()

    await this.props.dispatcher.performForcePush(this.props.repository)
  }
}

export const ConfirmForcePush = withTranslation()(
  ConfirmForcePushInternal
) as unknown as React.ComponentClass<IConfirmForcePushProps>
