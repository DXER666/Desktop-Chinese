import * as React from 'react'
import {
  withTranslation,
  WithTranslation,
} from 'react-i18next'
import { DialogContent } from '../dialog'
import { Checkbox, CheckboxValue } from '../lib/checkbox'
import { LinkButton } from '../lib/link-button'
import {
  getNotificationSettingsUrl,
  supportsNotifications,
  supportsNotificationsPermissionRequest,
} from 'desktop-notifications'
import {
  getNotificationsPermission,
  requestNotificationsPermission,
} from '../main-process-proxy'

interface INotificationPreferencesProps {
  readonly notificationsEnabled: boolean
  readonly onNotificationsEnabledChanged: (checked: boolean) => void
}

interface INotificationPreferencesState {
  readonly suggestGrantNotificationPermission: boolean
  readonly warnNotificationsDenied: boolean
  readonly suggestConfigureNotifications: boolean
}

export class NotificationsInternal extends React.Component<
  INotificationPreferencesProps & WithTranslation,
  INotificationPreferencesState
> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public constructor(props: any) {
    super(props)

    this.state = {
      suggestGrantNotificationPermission: false,
      warnNotificationsDenied: false,
      suggestConfigureNotifications: false,
    }
  }

  public componentDidMount() {
    this.updateNotificationsState()
  }

  private onNotificationsEnabledChanged = (
    event: React.FormEvent<HTMLInputElement>
  ) => {
    this.props.onNotificationsEnabledChanged(event.currentTarget.checked)
  }

  public render() {
    const { t } = this.props
    return (
      <DialogContent>
        <div className="advanced-section">
          <h2>{t('preferences.notifications.title')}</h2>
          <Checkbox
            label={t('preferences.notifications.enableNotifications')}
            value={
              this.props.notificationsEnabled
                ? CheckboxValue.On
                : CheckboxValue.Off
            }
            onChange={this.onNotificationsEnabledChanged}
          />
          <p className="settings-description">
            {t('preferences.notifications.notificationsDescription')}
            {this.renderNotificationHint()}
          </p>
        </div>
      </DialogContent>
    )
  }

  private onGrantNotificationPermission = async () => {
    await requestNotificationsPermission()
    this.updateNotificationsState()
  }

  private async updateNotificationsState() {
    const notificationsPermission = await getNotificationsPermission()
    this.setState({
      suggestGrantNotificationPermission:
        supportsNotificationsPermissionRequest() &&
        notificationsPermission === 'default',
      warnNotificationsDenied: notificationsPermission === 'denied',
      suggestConfigureNotifications: notificationsPermission === 'granted',
    })
  }

  private renderNotificationHint() {
    const { t } = this.props
    // No need to bother the user if their environment doesn't support our
    // notifications or if they've been explicitly disabled.
    if (!supportsNotifications() || !this.props.notificationsEnabled) {
      return null
    }

    const {
      suggestGrantNotificationPermission,
      warnNotificationsDenied,
      suggestConfigureNotifications,
    } = this.state

    if (suggestGrantNotificationPermission) {
      return (
        <>
          {' '}
          {t('preferences.notifications.youNeedTo')}{' '}
          <LinkButton onClick={this.onGrantNotificationPermission}>
            {t('preferences.notifications.grantPermission')}
          </LinkButton>{' '}
          {t(
            'preferences.notifications.toDisplayTheseNotificationsFromGitHubDesktop'
          )}
        </>
      )
    }

    const notificationSettingsURL = getNotificationSettingsUrl()

    if (notificationSettingsURL === null) {
      return null
    }

    if (warnNotificationsDenied) {
      return (
        <div className="setting-hint-warning">
          <span className="warning-icon">⚠️</span>{' '}
          {t(
            'preferences.notifications.githubDesktopHasNoPermissionToDisplayNotifications'
          )}{' '}
          <LinkButton uri={notificationSettingsURL}>
            {t('preferences.notifications.notificationsSettings')}
          </LinkButton>
          .
        </div>
      )
    }

    const verb = suggestConfigureNotifications
      ? t('preferences.notifications.properlyConfigured')
      : t('preferences.notifications.enabled')

    return (
      <>
        {' '}
        {t('preferences.notifications.makeSureNotificationsAre')} {verb}{' '}
        {t('preferences.notifications.forGitHubDesktopInThe')}{' '}
        <LinkButton uri={notificationSettingsURL}>
          {t('preferences.notifications.notificationsSettings')}
        </LinkButton>
        .
      </>
    )
  }
}

export const Notifications = withTranslation()(NotificationsInternal)
