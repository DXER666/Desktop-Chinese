import * as React from 'react'
import { DialogContent } from '../dialog'
import { LinkButton } from '../lib/link-button'
import { CallToAction } from '../lib/call-to-action'
import { withTranslation, WithTranslation } from 'react-i18next'

const HelpURL = 'https://help.github.com/articles/about-remote-repositories/'

interface INoRemoteProps {
  /** The function to call when the users chooses to publish. */
  readonly onPublish: () => void
}

class NoRemoteInternal extends React.Component<
  INoRemoteProps & WithTranslation,
  {}
> {
  public render() {
    const { t } = this.props
    return (
      <DialogContent>
        <CallToAction
          actionTitle={t('noRemote.publishButton', 'Publish')}
          onAction={this.props.onPublish}
        >
          <div className="no-remote-publish-message">
            {t('noRemote.introLine', 'Publish your repository to GitHub.')}
            {t('noRemote.needHelpPrefix', ' Need help? ')}
            <LinkButton uri={HelpURL}>
              {t(
                'noRemote.learnMoreLink',
                'Learn more about remote repositories.'
              )}
            </LinkButton>
          </div>
        </CallToAction>
      </DialogContent>
    )
  }
}

/** The component for when a repository has no remote. */
export const NoRemote = withTranslation()(
  NoRemoteInternal
) as unknown as React.ComponentClass<INoRemoteProps>
