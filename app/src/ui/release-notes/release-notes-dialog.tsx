import * as React from 'react'
import { withTranslation, WithTranslation } from 'react-i18next'
import { ReleaseNote, ReleaseSummary } from '../../models/release-notes'
import { updateStore } from '../lib/update-store'
import { LinkButton } from '../lib/link-button'
import { Dialog, DialogContent, DialogFooter } from '../dialog'
import { RichText } from '../lib/rich-text'
import { shell } from '../../lib/app-shell'
import { ReleaseNotesUri } from '../lib/releases'
import { OkCancelButtonGroup } from '../dialog/ok-cancel-button-group'
import { DesktopFakeRepository } from '../../lib/desktop-fake-repository'
import { SandboxedMarkdown } from '../lib/sandboxed-markdown'
import { Button } from '../lib/button'
import { Emoji } from '../../lib/emoji'

interface IReleaseNotesProps {
  readonly onDismissed: () => void
  readonly emoji: Map<string, Emoji>
  readonly newReleases: ReadonlyArray<ReleaseSummary>
  readonly underlineLinks: boolean
}

interface IReleaseNotesState {
  readonly checkState: 'idle' | 'checking' | 'updated' | 'notUpdated' | 'error'
  readonly latestVersion: string | null
  readonly downloadUrl: string | null
}

/**
 * The dialog to show with details about the newest release
 */
class ReleaseNotesInternal extends React.Component<
  IReleaseNotesProps & WithTranslation,
  IReleaseNotesState
> {
  public constructor(props: IReleaseNotesProps & WithTranslation) {
    super(props)
    this.state = {
      checkState: 'idle',
      latestVersion: null,
      downloadUrl: null,
    }
  }
  private renderList(
    releaseEntries: ReadonlyArray<ReleaseNote>,
    header: string
  ): JSX.Element | null {
    if (releaseEntries.length === 0) {
      return null
    }

    const options = new Array<JSX.Element>()

    for (const [i, entry] of releaseEntries.entries()) {
      options.push(
        <li key={i}>
          <RichText
            text={entry.message}
            emoji={this.props.emoji}
            renderUrlsAsLinks={true}
            repository={DesktopFakeRepository}
          />
        </li>
      )
    }

    return (
      <div className="section">
        <p className="header">
          <strong>{header}</strong>
        </p>
        <ul className="entries">{options}</ul>
      </div>
    )
  }

  private drawSingleColumnLayout(release: ReleaseSummary): JSX.Element {
    const { t } = this.props
    return (
      <div className="container">
        <div className="column">
          {this.renderList(
            release.bugfixes,
            t('releaseNotes.bugfixes', 'Bugfixes')
          )}
          {this.renderList(
            release.enhancements,
            t('releaseNotes.enhancements', 'Enhancements')
          )}
          {this.renderList(release.other, t('releaseNotes.other', 'Other'))}
        </div>
      </div>
    )
  }

  private drawTwoColumnLayout(release: ReleaseSummary): JSX.Element {
    const { t } = this.props
    return (
      <div className="container">
        <div className="column">
          {this.renderList(
            release.enhancements,
            t('releaseNotes.enhancements', 'Enhancements')
          )}
          {this.renderList(release.other, t('releaseNotes.other', 'Other'))}
        </div>
        <div className="column">
          {this.renderList(
            release.bugfixes,
            t('releaseNotes.bugfixes', 'Bugfixes')
          )}
        </div>
      </div>
    )
  }

  /**
   * If there is just one release, it returns it. If multiple, it merges the release notes.
   */
  private getDisplayRelease = () => {
    const { newReleases } = this.props

    const latestRelease = newReleases.at(0)
    const oldestRelease = newReleases.at(-1)

    if (
      latestRelease === undefined ||
      oldestRelease === undefined ||
      latestRelease === oldestRelease
    ) {
      return latestRelease
    }

    return {
      latestVersion: `${oldestRelease.latestVersion} - ${latestRelease.latestVersion}`,
      datePublished: `${oldestRelease.datePublished} to ${latestRelease.datePublished}`,
      enhancements: newReleases.flatMap(r => r.enhancements),
      bugfixes: newReleases.flatMap(r => r.bugfixes),
      pretext: newReleases.flatMap(r => r.pretext),
      other: [],
      thankYous: [],
    }
  }

  private renderPretext = (pretext: ReadonlyArray<ReleaseNote>) => {
    if (pretext.length === 0) {
      return
    }
    const { t } = this.props

    return (
      <SandboxedMarkdown
        markdown={pretext[0].message}
        emoji={this.props.emoji}
        onMarkdownLinkClicked={this.onMarkdownLinkClicked}
        underlineLinks={this.props.underlineLinks}
        ariaLabel={t(
          'releaseNotes.generatedMarkdownAriaLabel',
          'Release notes generated from markdown'
        )}
      />
    )
  }

  private onDismissed = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault()
    this.props.onDismissed()
  }

  private renderButtons = () => {
    const { t } = this.props
    const latestVersion = this.props.newReleases[0].latestVersion
    if (latestVersion === __APP_VERSION__) {
      return (
        <Button type="submit" onClick={this.onDismissed}>
          {t('releaseNotes.closeButton', 'Close')}
        </Button>
      )
    }

    return (
      <OkCancelButtonGroup
        destructive={true}
        okButtonText={
          __DARWIN__
            ? t('releaseNotes.installAndRestartDarwin', 'Install and Restart')
            : t('releaseNotes.installAndRestartOther', 'Install and restart')
        }
        cancelButtonText={t('releaseNotes.closeButton', 'Close')}
      />
    )
  }

  public render() {
    const release = this.getDisplayRelease()

    if (release === undefined) {
      return null
    }

    const { latestVersion, datePublished, enhancements, bugfixes, pretext } =
      release

    const { t } = this.props

    const contents =
      enhancements.length > 0 && bugfixes.length > 0
        ? this.drawTwoColumnLayout(release)
        : this.drawSingleColumnLayout(release)

    const dialogHeader = (
      <>
        <span className="version">
          {t('releaseNotes.versionLabel', 'Version {{latestVersion}}', {
            latestVersion,
          })}
        </span>
        <span className="date">{datePublished}</span>
      </>
    )

    return (
      <Dialog
        id="release-notes"
        onDismissed={this.props.onDismissed}
        onSubmit={this.updateNow}
        title={dialogHeader}
      >
        <DialogContent>
          {this.renderPretext(pretext)}
          {contents}
        </DialogContent>
        <DialogFooter>
          <LinkButton onClick={this.showAllReleaseNotes}>
            {t('releaseNotes.viewAllReleaseNotes', 'View all release notes')}
          </LinkButton>
          {this.renderUpdateCheckStatus()}
          {this.renderCheckUpdateButton()}
          {this.renderButtons()}
        </DialogFooter>
      </Dialog>
    )
  }

  private renderUpdateCheckStatus = () => {
    const { t } = this.props
    const { checkState, latestVersion } = this.state

    if (checkState === 'checking') {
      return (
        <span className="update-check-status">
          {t('releaseNotes.checkingForUpdates', 'Checking for updates…')}
        </span>
      )
    }

    if (checkState === 'updated') {
      return (
        <span className="update-check-status">
          {t(
            'releaseNotes.updateAvailable',
            'New version {{latestVersion}} available',
            {
              latestVersion,
            }
          )}
        </span>
      )
    }

    if (checkState === 'notUpdated') {
      return (
        <span className="update-check-status">
          {t('releaseNotes.updateNotAvailable', 'You are up to date')}
        </span>
      )
    }

    if (checkState === 'error') {
      return (
        <span className="update-check-status">
          {t('releaseNotes.checkFailed', 'Failed to check for updates')}
        </span>
      )
    }

    return null
  }

  private renderCheckUpdateButton = () => {
    const { t } = this.props
    const { checkState, downloadUrl } = this.state

    if (checkState === 'updated' && downloadUrl !== null) {
      return (
        <Button onClick={this.goToDownload}>
          {t('releaseNotes.goToDownload', 'Go to download')}
        </Button>
      )
    }

    return (
      <Button
        onClick={this.checkForUpdates}
        disabled={checkState === 'checking'}
      >
        {checkState === 'checking'
          ? t('releaseNotes.checkingForUpdates', 'Checking for updates…')
          : t('releaseNotes.checkForUpdates', 'Check for updates')}
      </Button>
    )
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

  private updateNow = () => {
    updateStore.quitAndInstallUpdate()
  }

  private showAllReleaseNotes = () => {
    shell.openExternal(ReleaseNotesUri)
  }

  private onMarkdownLinkClicked = (url: string) => {
    shell.openExternal(url)
  }
}

export const ReleaseNotes = withTranslation()(
  ReleaseNotesInternal
) as unknown as React.ComponentClass<IReleaseNotesProps>
