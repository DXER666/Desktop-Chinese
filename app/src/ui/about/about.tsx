import * as React from 'react'

import { Row } from '../lib/row'
import { Button } from '../lib/button'
import {
  Dialog,
  DialogError,
  DialogContent,
  DefaultDialogFooter,
} from '../dialog'
import { LinkButton } from '../lib/link-button'
import { IUpdateState } from '../lib/update-store'
import { Loading } from '../lib/loading'
import { assertNever } from '../../lib/fatal-error'
import { ReleaseNotesUri } from '../lib/releases'
import { encodePathAsUrl } from '../../lib/path'
import { isOSNoLongerSupportedByElectron } from '../../lib/get-os'
import { AriaLiveContainer } from '../accessibility/aria-live-container'
import { shell } from '../../lib/app-shell'
import { withTranslation, WithTranslation } from 'react-i18next'

const logoPath = __DARWIN__
  ? 'static/logo-64x64@2x.png'
  : 'static/windows-logo-64x64@2x.png'
const DesktopLogo = encodePathAsUrl(__dirname, logoPath)

const ReportIssueUri = 'https://github.com/DXER666/Desktop-Chinese/issues'
const RepositoryUri = 'https://github.com/DXER666/Desktop-Chinese'

interface IAboutProps {
  /**
   * Event triggered when the dialog is dismissed by the user in the
   * ways described in the Dialog component's dismissible prop.
   */
  readonly onDismissed: () => void

  /**
   * The name of the currently installed (and running) application
   */
  readonly applicationName: string

  /**
   * The currently installed (and running) version of the app.
   */
  readonly applicationVersion: string

  /**
   * The currently installed (and running) architecture of the app.
   */
  readonly applicationArchitecture: string

  /** A function to call to kick off a non-staggered update check. */
  readonly onCheckForNonStaggeredUpdates: () => void

  readonly onShowAcknowledgements: () => void

  /** A function to call when the user wants to see Terms and Conditions. */
  readonly onShowTermsAndConditions: () => void
  readonly onQuitAndInstall: () => void

  readonly updateState: IUpdateState

  /**
   * A flag to indicate whether the About dialog should ignore that
   * it's running in development mode. Used exclusively by the AboutTestDialog
   */
  readonly allowDevelopment?: boolean
}

interface IAboutState {
  readonly checkState: 'idle' | 'checking' | 'updated' | 'notUpdated' | 'error'
  readonly latestVersion: string | null
  readonly downloadUrl: string | null
}

interface IUpdateInfoProps {
  readonly message: string
  readonly richMessage?: JSX.Element
  readonly loading?: boolean
}

class UpdateInfo extends React.Component<IUpdateInfoProps> {
  public render() {
    return (
      <div className="update-status">
        <AriaLiveContainer message={this.props.message} />

        {this.props.loading && <Loading />}
        {this.props.richMessage ?? this.props.message}
      </div>
    )
  }
}

/**
 * A dialog that presents information about the
 * running application such as name and version.
 */
class AboutImpl extends React.Component<
  IAboutProps & WithTranslation,
  IAboutState
> {
  public constructor(props: IAboutProps & WithTranslation) {
    super(props)
    this.state = {
      checkState: 'idle',
      latestVersion: null,
      downloadUrl: null,
    }
  }

  private get canCheckForUpdates() {
    return (
      __RELEASE_CHANNEL__ !== 'development' ||
      this.props.allowDevelopment === true
    )
  }

  private renderUpdateButton() {
    if (!this.canCheckForUpdates) {
      return null
    }

    const { checkState, downloadUrl } = this.state
    const { t } = this.props

    if (checkState === 'updated' && downloadUrl !== null) {
      return (
        <Row>
          <Button onClick={this.goToDownload}>{t('about.download')}</Button>
        </Row>
      )
    }

    const disabled =
      checkState === 'checking' || isOSNoLongerSupportedByElectron()

    return (
      <Row>
        <Button disabled={disabled} onClick={this.checkForUpdates}>
          {checkState === 'checking'
            ? t('about.checkingUpdates')
            : t('about.checkUpdates')}
        </Button>
      </Row>
    )
  }

  private renderUpdateDetails() {
    if (__LINUX__) {
      return null
    }

    const { t } = this.props
    if (!this.canCheckForUpdates) {
      return <p>{t('about.devModeInfo')}</p>
    }

    const { checkState, latestVersion } = this.state

    switch (checkState) {
      case 'checking':
        return (
          <UpdateInfo message={t('about.checkingUpdates')} loading={true} />
        )
      case 'updated':
        return (
          <UpdateInfo
            message={t('about.updateUpdated', {
              version: latestVersion ?? '',
            })}
          />
        )
      case 'notUpdated':
        return <UpdateInfo message={t('about.updateNotUpdated')} />
      case 'error':
        return <UpdateInfo message={t('about.updateError')} />
      case 'idle':
        return null
      default:
        return assertNever(
          checkState,
          `Unknown update check state ${checkState}`
        )
    }
  }

  private renderUpdateErrors() {
    if (__LINUX__) {
      return null
    }

    const { t } = this.props
    if (!this.canCheckForUpdates) {
      return null
    }

    if (isOSNoLongerSupportedByElectron()) {
      return (
        <DialogError>
          {t('about.osNotSupported')}{' '}
          <LinkButton uri="https://docs.github.com/en/desktop/installing-and-configuring-github-desktop/overview/supported-operating-systems">
            {t('about.osNotSupportedLink')}
          </LinkButton>
        </DialogError>
      )
    }

    return null
  }

  private checkForUpdates = async () => {
    this.setState({ checkState: 'checking' })

    try {
      const response = await fetch(
        `https://github-desktop.rjjm.dpdns.org/api/update?version=${__APP_VERSION__}`,
        { headers: { accept: 'application/json' } }
      )

      if (!response.ok) {
        throw new Error(`Unexpected response: ${response.status}`)
      }

      const data = await response.json()

      if (data.has_update === true && data.download_url) {
        this.setState({
          checkState: 'updated',
          latestVersion: data.latest_version ?? null,
          downloadUrl: data.download_url,
        })
      } else {
        this.setState({ checkState: 'notUpdated' })
      }
    } catch {
      this.setState({ checkState: 'error' })
    }
  }

  private goToDownload = () => {
    const { downloadUrl } = this.state
    if (downloadUrl !== null) {
      shell.openExternal(downloadUrl)
    }
  }

  public render() {
    const { t } = this.props
    const version = this.props.applicationVersion
    const releaseNotesLink = (
      <>
        <LinkButton uri={ReleaseNotesUri}>{t('about.releaseNotes')}</LinkButton>
        {`（${t('about.officialDevBuild')}）`}
      </>
    )

    const versionText = __DEV__
      ? t('about.buildLabel', { version })
      : t('about.versionLabel', { version })
    const titleId = 'Dialog_about'

    return (
      <Dialog
        id="about"
        titleId={titleId}
        onSubmit={this.props.onDismissed}
        onDismissed={this.props.onDismissed}
      >
        {this.renderUpdateErrors()}
        <DialogContent>
          <Row className="logo">
            <img
              src={DesktopLogo}
              alt="GitHub Desktop"
              width="64"
              height="64"
            />
          </Row>
          <h1 id={titleId}>{t('about.title')}</h1>
          <p className="no-padding">
            <span className="selectable-text">
              {versionText} ({this.props.applicationArchitecture})
            </span>{' '}
            ({releaseNotesLink})
          </p>
          {this.renderUpdateDetails()}
          {this.renderUpdateButton()}
          <div className="terms-and-license-container">
            <p className="no-padding terms-and-license">
              <LinkButton uri={ReportIssueUri}>
                {t('about.reportIssue')}
              </LinkButton>
            </p>
            <p className="no-padding terms-and-license">
              <LinkButton uri={RepositoryUri}>
                {t('about.visitRepository')}
              </LinkButton>
            </p>
            <p className="no-padding terms-and-license">
              <LinkButton onClick={this.props.onShowTermsAndConditions}>
                {t('about.termsAndConditions')}
              </LinkButton>
            </p>
            <p className="no-padding terms-and-license">
              <LinkButton onClick={this.props.onShowAcknowledgements}>
                {t('about.acknowledgements')}
              </LinkButton>
            </p>
            <p className="terms-and-license">
              <LinkButton uri="https://gh.io/copilot-for-desktop-transparency">
                {t('about.copilotResponsibleUse')}
              </LinkButton>
            </p>
          </div>
        </DialogContent>
        <DefaultDialogFooter buttonText={t('about.close')} />
      </Dialog>
    )
  }
}

export const About = withTranslation()(AboutImpl) as any
