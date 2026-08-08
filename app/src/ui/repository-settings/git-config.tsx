import * as React from 'react'
import { DialogContent } from '../dialog'
import { Account } from '../../models/account'
import { GitConfigUserForm } from '../lib/git-config-user-form'
import { Row } from '../lib/row'
import { RadioGroup } from '../lib/radio-group'
import { assertNever } from '../../lib/fatal-error'
import memoizeOne from 'memoize-one'
import { withTranslation, WithTranslation } from 'react-i18next'

interface IGitConfigProps {
  readonly account: Account | null

  readonly gitConfigLocation: GitConfigLocation
  readonly name: string
  readonly email: string
  readonly globalName: string
  readonly globalEmail: string
  readonly isLoadingGitConfig: boolean

  readonly onGitConfigLocationChanged: (value: GitConfigLocation) => void
  readonly onNameChanged: (name: string) => void
  readonly onEmailChanged: (email: string) => void
}

export enum GitConfigLocation {
  Global = 'Global',
  Local = 'Local',
}

class GitConfigInternal extends React.Component<
  IGitConfigProps & WithTranslation
> {
  // To avoid recreating the accounts array on every render
  private getAccounts = memoizeOne((account: Account | null) =>
    account ? [account] : []
  )

  private onGitConfigLocationChanged = (value: GitConfigLocation) => {
    this.props.onGitConfigLocationChanged(value)
  }
  private renderConfigOptionLabel = (key: GitConfigLocation) => {
    const { t } = this.props
    switch (key) {
      case GitConfigLocation.Global:
        return t(
          'repositorySettings.gitConfig.useGlobal',
          'Use my global Git config'
        )
      case GitConfigLocation.Local:
        return t(
          'repositorySettings.gitConfig.useLocal',
          'Use a local Git config'
        )
      default:
        return assertNever(key, `Unknown git config location: ${key}`)
    }
  }

  public render() {
    const { t } = this.props
    const configOptions = [GitConfigLocation.Global, GitConfigLocation.Local]
    const selectionOption =
      configOptions.find(o => o === this.props.gitConfigLocation) ??
      GitConfigLocation.Global

    return (
      <DialogContent>
        <div className="advanced-section">
          <h2 id="git-config-heading">
            {t(
              'repositorySettings.gitConfig.heading',
              'For this repository I wish to'
            )}
          </h2>
          <Row>
            <RadioGroup<GitConfigLocation>
              ariaLabelledBy="git-config-heading"
              selectedKey={selectionOption}
              radioButtonKeys={configOptions}
              onSelectionChanged={this.onGitConfigLocationChanged}
              renderRadioButtonLabelContents={this.renderConfigOptionLabel}
            />
          </Row>
          <GitConfigUserForm
            email={
              this.props.gitConfigLocation === GitConfigLocation.Global
                ? this.props.globalEmail
                : this.props.email
            }
            name={
              this.props.gitConfigLocation === GitConfigLocation.Global
                ? this.props.globalName
                : this.props.name
            }
            accounts={this.getAccounts(this.props.account)}
            disabled={this.props.gitConfigLocation === GitConfigLocation.Global}
            onEmailChanged={this.props.onEmailChanged}
            onNameChanged={this.props.onNameChanged}
            isLoadingGitConfig={this.props.isLoadingGitConfig}
          />
        </div>
      </DialogContent>
    )
  }
}

/** A view for creating or modifying the repository's gitignore file */
export const GitConfig = withTranslation()(
  GitConfigInternal
) as unknown as React.ComponentClass<IGitConfigProps>
