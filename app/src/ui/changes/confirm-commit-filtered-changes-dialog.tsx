import * as React from 'react'
import { withTranslation, WithTranslation } from 'react-i18next'
import { Dialog, DialogContent, DialogFooter } from '../dialog'
import { Row } from '../lib/row'
import { OkCancelButtonGroup } from '../dialog/ok-cancel-button-group'
import { Checkbox, CheckboxValue } from '../lib/checkbox'
import { LinkButton } from '../lib/link-button'

interface IConfirmCommitFilteredChangesProps {
  readonly onCommitAnyway: () => void
  readonly onDismissed: () => void
  readonly showFilesToBeCommitted: () => void
  readonly setConfirmCommitFilteredChanges: (value: boolean) => void
}

interface IConfirmCommitFilteredChangesState {
  readonly askForConfirmationOnCommitFilteredChanges: boolean
}

export class ConfirmCommitFilteredChangesInternal extends React.Component<
  IConfirmCommitFilteredChangesProps & WithTranslation,
  IConfirmCommitFilteredChangesState
> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public constructor(props: any) {
    super(props)

    this.state = {
      askForConfirmationOnCommitFilteredChanges: true,
    }
  }

  public render() {
    const { t } = this.props
    return (
      <Dialog
        id="hidden-changes"
        type="warning"
        title={
          __DARWIN__
            ? t('confirmCommitFilteredChanges.titleDarwin')
            : t('confirmCommitFilteredChanges.titleOther')
        }
        onSubmit={this.onSubmit}
        onDismissed={this.props.onDismissed}
        role="alertdialog"
        ariaDescribedBy="confirm-commit-filtered-changes-message"
      >
        <DialogContent>
          <p id="confirm-commit-filtered-changes-message">
            {t('confirmCommitFilteredChanges.messagePart1')}{' '}
            <LinkButton onClick={this.showFilesToBeCommitted}>
              {t('confirmCommitFilteredChanges.hiddenChanges')}
            </LinkButton>{' '}
            {t('confirmCommitFilteredChanges.messagePart2')}
          </p>
          <Row>
            <Checkbox
              label={t('confirmCommitFilteredChanges.doNotShowAgain')}
              value={
                this.state.askForConfirmationOnCommitFilteredChanges
                  ? CheckboxValue.Off
                  : CheckboxValue.On
              }
              onChange={this.onShowMessageChange}
            />
          </Row>
        </DialogContent>
        <DialogFooter>
          <OkCancelButtonGroup
            destructive={true}
            okButtonText={
              __DARWIN__
                ? t('confirmCommitFilteredChanges.commitAnywayDarwin')
                : t('confirmCommitFilteredChanges.commitAnywayOther')
            }
            cancelButtonText={t('common.cancel')}
            onCancelButtonClick={this.props.onDismissed}
          />
        </DialogFooter>
      </Dialog>
    )
  }

  private onShowMessageChange = (event: React.FormEvent<HTMLInputElement>) => {
    const value = !event.currentTarget.checked

    this.setState({ askForConfirmationOnCommitFilteredChanges: value })
  }

  private showFilesToBeCommitted = () => {
    this.props.showFilesToBeCommitted()
    this.props.onDismissed()
  }

  private onSubmit = () => {
    this.props.setConfirmCommitFilteredChanges(
      this.state.askForConfirmationOnCommitFilteredChanges
    )
    this.props.onCommitAnyway()
    this.props.onDismissed()
  }
}

export const ConfirmCommitFilteredChanges = withTranslation()(
  ConfirmCommitFilteredChangesInternal
)
