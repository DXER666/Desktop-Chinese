import * as React from 'react'
import { WelcomeStep } from './welcome'
import { Button } from '../lib/button'
import { SignIn } from '../lib/sign-in'
import { Dispatcher } from '../dispatcher'
import { SignInState } from '../../lib/stores'
import { withTranslation, WithTranslation } from 'react-i18next'

interface ISignInEnterpriseProps {
  readonly dispatcher: Dispatcher
  readonly advance: (step: WelcomeStep) => void
  readonly signInState: SignInState | null
}

class SignInEnterpriseInternal extends React.Component<
  ISignInEnterpriseProps & WithTranslation,
  {}
> {
  public render() {
    const state = this.props.signInState

    if (!state) {
      return null
    }

    const t = this.props.t
    const title = __DARWIN__
      ? t('welcome.signInEnterprise.titleDarwin', 'Sign in to your GitHub Enterprise')
      : t('welcome.signInEnterprise.titleOther', 'Sign in to your GitHub Enterprise')

    return (
      <section
        id="sign-in-enterprise"
        aria-label={t(
          'welcome.signInEnterprise.ariaLabel',
          'Sign in to your GitHub Enterprise'
        )}
      >
        <h1 className="welcome-title">{title}</h1>

        <SignIn signInState={state} dispatcher={this.props.dispatcher}>
          <Button onClick={this.cancel}>
            {t('common.cancel', 'Cancel')}
          </Button>
        </SignIn>
      </section>
    )
  }

  private cancel = () => {
    this.props.advance(WelcomeStep.Start)
  }
}

/** The Welcome flow step to login to an Enterprise instance. */
export const SignInEnterprise = withTranslation()(
  SignInEnterpriseInternal
) as unknown as React.ComponentClass<ISignInEnterpriseProps>
