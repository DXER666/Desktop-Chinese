import * as React from 'react'
import {
  withTranslation,
  WithTranslation,
} from 'react-i18next'
import {
  Account,
  isDotComAccount,
  isEnterpriseAccount,
} from '../../models/account'
import { IAvatarUser } from '../../models/avatar'
import { lookupPreferredEmail } from '../../lib/email'
import { assertNever } from '../../lib/fatal-error'
import { Button } from '../lib/button'
import { Row } from '../lib/row'
import { DialogContent, DialogPreferredFocusClassName } from '../dialog'
import { Avatar } from '../lib/avatar'
import { CallToAction } from '../lib/call-to-action'
import { getHTMLURL } from '../../lib/api'

interface IAccountsProps {
  readonly accounts: ReadonlyArray<Account>

  readonly onDotComSignIn: () => void
  readonly onEnterpriseSignIn: () => void
  readonly onLogout: (account: Account) => void
}

enum SignInType {
  DotCom,
  Enterprise,
}

export class AccountsInternal extends React.Component<
  IAccountsProps & WithTranslation
> {
  public render() {
    const { accounts, t } = this.props
    const dotComAccount = accounts.find(isDotComAccount)

    return (
      <DialogContent className="accounts-tab">
        <h2>{t('preferences.accounts.githubDotCom')}</h2>
        {dotComAccount
          ? this.renderAccount(dotComAccount, SignInType.DotCom)
          : this.renderSignIn(SignInType.DotCom)}

        <h2>{t('preferences.accounts.githubEnterprise')}</h2>
        {this.renderMultipleEnterpriseAccounts()}
      </DialogContent>
    )
  }

  private renderMultipleEnterpriseAccounts() {
    const { t } = this.props
    const enterpriseAccounts = this.props.accounts.filter(isEnterpriseAccount)

    return (
      <>
        {enterpriseAccounts.map(account => {
          return this.renderAccount(account, SignInType.Enterprise)
        })}
        {enterpriseAccounts.length === 0 ? (
          this.renderSignIn(SignInType.Enterprise)
        ) : (
          <Button onClick={this.props.onEnterpriseSignIn}>
            {t('preferences.accounts.addEnterpriseAccount')}
          </Button>
        )}
      </>
    )
  }

  private renderAccount(account: Account, type: SignInType) {
    const { t } = this.props
    const avatarUser: IAvatarUser = {
      name: account.name,
      email: lookupPreferredEmail(account),
      avatarURL: account.avatarURL,
      endpoint: account.endpoint,
    }

    // The DotCom account is shown first, so its sign in/out button should be
    // focused initially when the dialog is opened.
    const className =
      type === SignInType.DotCom ? DialogPreferredFocusClassName : undefined

    return (
      <Row className="account-info">
        <div className="user-info-container">
          <Avatar accounts={this.props.accounts} user={avatarUser} />
          <div className="user-info">
            {isEnterpriseAccount(account) ? (
              <>
                <div className="account-title">
                  {account.name === account.login
                    ? `@${account.login}`
                    : `@${account.login} (${account.name})`}
                </div>
                <div className="endpoint">{getHTMLURL(account.endpoint)}</div>
              </>
            ) : (
              <>
                <div className="name">{account.name}</div>
                <div className="login">@{account.login}</div>
              </>
            )}
          </div>
        </div>
        <Button onClick={this.logout(account)} className={className}>
          {__DARWIN__
            ? t('preferences.accounts.signOutDarwin')
            : t('preferences.accounts.signOutOther')}
        </Button>
      </Row>
    )
  }

  private onDotComSignIn = () => {
    this.props.onDotComSignIn()
  }

  private onEnterpriseSignIn = () => {
    this.props.onEnterpriseSignIn()
  }

  private renderSignIn(type: SignInType) {
    const { t } = this.props
    const signInTitle = __DARWIN__
      ? t('preferences.accounts.signIntoDarwin')
      : t('preferences.accounts.signIntoOther')
    switch (type) {
      case SignInType.DotCom: {
        return (
          <CallToAction
            actionTitle={`${signInTitle} ${t(
              'preferences.accounts.githubDotCom'
            )}`}
            onAction={this.onDotComSignIn}
            // The DotCom account is shown first, so its sign in/out button should be
            // focused initially when the dialog is opened.
            buttonClassName={DialogPreferredFocusClassName}
          >
            <div>{t('preferences.accounts.signInActionDotCom')}</div>
          </CallToAction>
        )
      }
      case SignInType.Enterprise:
        return (
          <CallToAction
            actionTitle={`${signInTitle} ${t(
              'preferences.accounts.githubEnterprise'
            )}`}
            onAction={this.onEnterpriseSignIn}
          >
            <div>{t('preferences.accounts.signInActionEnterprise')}</div>
          </CallToAction>
        )
      default:
        return assertNever(type, `Unknown sign in type: ${type}`)
    }
  }

  private logout = (account: Account) => {
    return () => {
      this.props.onLogout(account)
    }
  }
}

export const Accounts = withTranslation()(AccountsInternal)
