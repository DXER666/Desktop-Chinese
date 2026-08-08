import * as React from 'react'
import { withTranslation, WithTranslation } from 'react-i18next'

/** 简化版 t 函数类型：只接受一个 string key，返回 string */
type SimpleTFunction = (key: string, options?: any) => any
import { Dispatcher } from '../dispatcher'
import {
  SignInState,
  SignInStep,
  IEndpointEntryState,
  IAuthenticationState,
  IExistingAccountWarning,
} from '../../lib/stores'
import { assertNever } from '../../lib/fatal-error'
import { Row } from '../lib/row'
import { TextBox } from '../lib/text-box'
import { Dialog, DialogError, DialogContent, DialogFooter } from '../dialog'

import { OkCancelButtonGroup } from '../dialog/ok-cancel-button-group'
import { Ref } from '../lib/ref'
import { getHTMLURL } from '../../lib/api'

interface ISignInProps {
  readonly dispatcher: Dispatcher
  readonly signInState: SignInState | null
  readonly onDismissed: () => void
  readonly isCredentialHelperSignIn?: boolean
  readonly credentialHelperUrl?: string
}

interface ISignInState {
  readonly endpoint: string
}

/**
 * 使用 t 函数返回登录浏览器标题（避免在组件外硬编码翻译）
 */
function getSignInWithBrowserTitle(t: SimpleTFunction): string {
  return __DARWIN__
    ? t('signIn.titleWithBrowserDarwin')
    : t('signIn.titleWithBrowserOther')
}

/**
 * 使用 t 函数返回默认标题
 */
function getDefaultTitle(t: SimpleTFunction): string {
  return t('signIn.titleDefault')
}

/**
 * 使用 t 函数返回浏览器登录的说明内容 JSX
 */
function getBrowserSignInInfoContent(t: SimpleTFunction): JSX.Element {
  return <p>{t('signIn.browserInfoContent')}</p>
}

class SignInInternal extends React.Component<
  ISignInProps & WithTranslation,
  ISignInState
> {
  private readonly dialogRef = React.createRef<Dialog>()

  public constructor(props: ISignInProps & WithTranslation) {
    super(props)

    this.state = {
      endpoint: '',
    }
  }

  public componentDidUpdate(prevProps: ISignInProps) {
    // Whenever the sign in step changes we replace the dialog contents which
    // means we need to re-focus the first suitable child element as it's
    // essentially a "new" dialog we're showing only the dialog component itself
    // doesn't know that.
    if (prevProps.signInState !== null && this.props.signInState !== null) {
      if (prevProps.signInState.kind !== this.props.signInState.kind) {
        this.dialogRef.current?.focusFirstSuitableChild()
      }
    }
  }

  public componentWillReceiveProps(nextProps: ISignInProps) {
    if (nextProps.signInState !== this.props.signInState) {
      if (
        nextProps.signInState &&
        nextProps.signInState.kind === SignInStep.Success
      ) {
        this.onDismissed()
      }
    }
  }

  private onSubmit = () => {
    const state = this.props.signInState

    if (!state) {
      return
    }

    const stepKind = state.kind

    switch (state.kind) {
      case SignInStep.EndpointEntry:
        this.props.dispatcher.setSignInEndpoint(this.state.endpoint)
        break
      case SignInStep.ExistingAccountWarning:
        this.props.dispatcher
          .removeAccount(state.existingAccount)
          .then(() => this.props.dispatcher.setSignInEndpoint(state.endpoint))
        break
      case SignInStep.Authentication:
        this.props.dispatcher.requestBrowserAuthentication()
        break
      case SignInStep.Success:
        this.onDismissed()
        break
      default:
        assertNever(state, `Unknown sign in step ${stepKind}`)
    }
  }

  private onEndpointChanged = (endpoint: string) => {
    this.setState({ endpoint })
  }

  private renderFooter(): JSX.Element | null {
    const { t } = this.props
    const state = this.props.signInState

    if (!state || state.kind === SignInStep.Success) {
      return null
    }

    let disableSubmit = false

    let primaryButtonText: string
    const stepKind = state.kind
    const continueWithBrowserLabel = __DARWIN__
      ? t('signIn.continueWithBrowserDarwin')
      : t('signIn.continueWithBrowserOther')

    switch (state.kind) {
      case SignInStep.EndpointEntry:
        disableSubmit = this.state.endpoint.length === 0
        primaryButtonText = t('signIn.continueButton')
        break
      case SignInStep.ExistingAccountWarning:
        primaryButtonText = continueWithBrowserLabel
        break
      case SignInStep.Authentication:
        primaryButtonText = continueWithBrowserLabel
        break
      default:
        return assertNever(state, `Unknown sign in step ${stepKind}`)
    }

    return (
      <DialogFooter>
        <OkCancelButtonGroup
          okButtonText={primaryButtonText}
          okButtonDisabled={disableSubmit || state.loading}
          cancelButtonDisabled={false}
          onCancelButtonClick={this.onDismissed}
        />
      </DialogFooter>
    )
  }

  private renderExistingAccountWarningStep(state: IExistingAccountWarning) {
    const { t } = this.props
    return (
      <DialogContent>
        <p className="existing-account-warning">
          {t('signIn.existingAccountWarning1')}{' '}
          <Ref>{new URL(getHTMLURL(state.endpoint)).host}</Ref>{' '}
          {t('signIn.existingAccountWarning2')}{' '}
          <Ref>{state.existingAccount.login}</Ref>
          {t('signIn.existingAccountWarning3')}
        </p>
        {getBrowserSignInInfoContent(t)}
      </DialogContent>
    )
  }

  private renderEndpointEntryStep(state: IEndpointEntryState) {
    const { t } = this.props
    return (
      <DialogContent>
        <Row>
          <TextBox
            label={t('signIn.enterpriseAddress')}
            value={this.state.endpoint}
            onValueChanged={this.onEndpointChanged}
            placeholder={t('signIn.enterprisePlaceholder')}
          />
        </Row>
      </DialogContent>
    )
  }

  private renderAuthenticationStep(state: IAuthenticationState) {
    const { t } = this.props
    const credentialHelperInfo =
      this.props.isCredentialHelperSignIn && this.props.credentialHelperUrl ? (
        <p>
          {t('signIn.credentialHelperInfo')}{' '}
          <Ref>{this.props.credentialHelperUrl}</Ref>.
        </p>
      ) : undefined

    return (
      <DialogContent>
        {credentialHelperInfo}
        {getBrowserSignInInfoContent(t)}
      </DialogContent>
    )
  }

  private renderStep(): JSX.Element | null {
    const state = this.props.signInState

    if (!state) {
      return null
    }

    const stepKind = state.kind

    switch (state.kind) {
      case SignInStep.EndpointEntry:
        return this.renderEndpointEntryStep(state)
      case SignInStep.ExistingAccountWarning:
        return this.renderExistingAccountWarningStep(state)
      case SignInStep.Authentication:
        return this.renderAuthenticationStep(state)
      case SignInStep.Success:
        return null
      default:
        return assertNever(state, `Unknown sign in step ${stepKind}`)
    }
  }

  public render() {
    const { t } = this.props
    const state = this.props.signInState

    if (!state || state.kind === SignInStep.Success) {
      return null
    }

    const errors = state.error ? (
      <DialogError>{state.error.message}</DialogError>
    ) : null

    const title =
      this.props.signInState.kind === SignInStep.Authentication
        ? getSignInWithBrowserTitle(t)
        : getDefaultTitle(t)

    return (
      <Dialog
        id="sign-in"
        title={title}
        disabled={false}
        onDismissed={this.onDismissed}
        onSubmit={this.onSubmit}
        loading={state.loading}
        ref={this.dialogRef}
      >
        {errors}
        {this.renderStep()}
        {this.renderFooter()}
      </Dialog>
    )
  }

  private onDismissed = () => {
    this.props.dispatcher.resetSignInState()
    this.props.onDismissed()
  }
}

/**
 * 用 withTranslation 包装后导出的登录对话框组件。
 */
export const SignIn = withTranslation()(
  SignInInternal
) as React.ComponentClass<ISignInProps>
