import * as React from 'react'
import { Dispatcher } from '../dispatcher'
import { DialogFooter, DialogContent, Dialog } from '../dialog'
import { FetchType } from '../../models/fetch'
import { Repository } from '../../models/repository'
import { OkCancelButtonGroup } from '../dialog/ok-cancel-button-group'
import { withTranslation, WithTranslation } from 'react-i18next'

interface IPushNeedsPullWarningProps {
  readonly dispatcher: Dispatcher
  readonly repository: Repository
  readonly onDismissed: () => void
}

interface IPushNeedsPullWarningState {
  readonly isLoading: boolean
}

class PushNeedsPullWarningInternal extends React.Component<
  IPushNeedsPullWarningProps & WithTranslation,
  IPushNeedsPullWarningState
> {
  public constructor(props: IPushNeedsPullWarningProps & WithTranslation) {
    super(props)

    this.state = {
      isLoading: false,
    }
  }

  public render() {
    const { t } = this.props
    return (
      <Dialog
        title={
          __DARWIN__
            ? t('pushNeedsPull.titleDarwin', 'Newer Commits on Remote')
            : t('pushNeedsPull.titleOther', 'Newer commits on remote')
        }
        dismissDisabled={this.state.isLoading}
        disabled={this.state.isLoading}
        onDismissed={this.props.onDismissed}
        onSubmit={this.onFetch}
        loading={this.state.isLoading}
        type="warning"
      >
        <DialogContent>
          <p>
            {t(
              'pushNeedsPull.description',
              'GitHub Desktop is unable to push commits to this branch because there are commits on the remote that are not present on your local branch. Fetch these new commits before pushing in order to reconcile them with your local commits.'
            )}
          </p>
        </DialogContent>
        <DialogFooter>
          <OkCancelButtonGroup
            okButtonText={t('pushNeedsPull.fetchButton', 'Fetch')}
            okButtonDisabled={this.state.isLoading}
          />
        </DialogFooter>
      </Dialog>
    )
  }

  private onFetch = async () => {
    this.setState({ isLoading: true })
    await this.props.dispatcher.fetch(
      this.props.repository,
      FetchType.UserInitiatedTask
    )
    this.setState({ isLoading: false })
    this.props.onDismissed()
  }
}

export const PushNeedsPullWarning = withTranslation()(
  PushNeedsPullWarningInternal
) as unknown as React.ComponentClass<IPushNeedsPullWarningProps>
