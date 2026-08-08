import * as React from 'react'
import { WelcomeStep } from './welcome'
import { Account } from '../../models/account'
import { ConfigureGitUser } from '../lib/configure-git-user'
import { Button } from '../lib/button'
import { withTranslation, WithTranslation } from 'react-i18next'

interface IConfigureGitProps {
  readonly accounts: ReadonlyArray<Account>
  readonly advance: (step: WelcomeStep) => void
  readonly done: () => void
  readonly globalUserName: string | undefined
  readonly globalUserEmail: string | undefined
}

type ConfigureGitProps = IConfigureGitProps & WithTranslation

/** The Welcome flow step to configure git. */
class ConfigureGitInternal extends React.Component<ConfigureGitProps, {}> {
  public render() {
    const { t } = this.props
    return (
      <section id="configure-git" aria-label={t('welcome.configureGit.titleOther')}>
        <h1 className="welcome-title">{t('welcome.configureGit.titleOther')}</h1>
        <p className="welcome-text">
          {t('welcome.configureGit.introLine1')}
          &nbsp;{t('welcome.configureGit.introLine2')}
        </p>

        <ConfigureGitUser
          accounts={this.props.accounts}
          onSave={this.props.done}
          saveLabel={t('welcome.configureGit.finishButtonOther')}
          globalUserName={this.props.globalUserName}
          globalUserEmail={this.props.globalUserEmail}
        >
          <Button onClick={this.cancel}>{t('welcome.configureGit.cancel')}</Button>
        </ConfigureGitUser>
      </section>
    )
  }

  private cancel = () => {
    this.props.advance(WelcomeStep.Start)
  }
}

export const ConfigureGit = withTranslation()(
  ConfigureGitInternal
) as React.ComponentClass<IConfigureGitProps>
