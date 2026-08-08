import * as React from 'react'
import { withTranslation, WithTranslation } from 'react-i18next'

import { encodePathAsUrl } from '../../lib/path'

const CodeImage = encodePathAsUrl(__dirname, 'static/code.svg')
const TeamDiscussionImage = encodePathAsUrl(
  __dirname,
  'static/github-for-teams.svg'
)
const CloudServerImage = encodePathAsUrl(
  __dirname,
  'static/github-for-business.svg'
)

class TutorialWelcomeInternal extends React.Component<WithTranslation> {
  public render() {
    const { t } = this.props
    return (
      <div id="tutorial-welcome">
        <div className="header">
          <h1>{t('tutorialWelcome.title', 'Welcome to GitHub Desktop')}</h1>
          <p>
            {t(
              'tutorialWelcome.description',
              'Use this tutorial to get comfortable with Git, GitHub, and GitHub Desktop.'
            )}
          </p>
        </div>
        <ul className="definitions">
          <li>
            <img src={CodeImage} alt="Html syntax icon" />
            <p>
              <strong>Git</strong>{' '}
              {t(
                'tutorialWelcome.gitDescription',
                'is the version control system.'
              )}
            </p>
          </li>
          <li>
            <img
              src={TeamDiscussionImage}
              alt="People with discussion bubbles overhead"
            />
            <p>
              <strong>GitHub</strong>{' '}
              {t(
                'tutorialWelcome.githubDescription',
                'is where you store your code and collaborate with others.'
              )}
            </p>
          </li>
          <li>
            <img src={CloudServerImage} alt="Server stack with cloud" />
            <p>
              <strong>GitHub Desktop</strong>{' '}
              {t(
                'tutorialWelcome.desktopDescription',
                'helps you work with GitHub locally.'
              )}
            </p>
          </li>
        </ul>
      </div>
    )
  }
}

export const TutorialWelcome = withTranslation()(
  TutorialWelcomeInternal
) as unknown as React.ComponentClass
