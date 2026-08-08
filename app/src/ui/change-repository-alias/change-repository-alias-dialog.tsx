import * as React from 'react'

import { Dispatcher } from '../dispatcher'
import { nameOf, Repository } from '../../models/repository'
import { Dialog, DialogContent, DialogFooter } from '../dialog'
import { OkCancelButtonGroup } from '../dialog/ok-cancel-button-group'
import { TextBox } from '../lib/text-box'
import { withTranslation, WithTranslation } from 'react-i18next'

interface IChangeRepositoryAliasProps {
  readonly dispatcher: Dispatcher
  readonly onDismissed: () => void
  readonly repository: Repository
}

interface IChangeRepositoryAliasState {
  readonly newAlias: string
}

class ChangeRepositoryAliasInternal extends React.Component<
  IChangeRepositoryAliasProps & WithTranslation,
  IChangeRepositoryAliasState
> {
  public constructor(props: IChangeRepositoryAliasProps & WithTranslation) {
    super(props)

    this.state = { newAlias: props.repository.alias ?? props.repository.name }
  }

  public render() {
    const { t } = this.props
    const repository = this.props.repository
    const verb =
      repository.alias === null
        ? t('repositoryAlias.verbCreate', 'Create')
        : t('repositoryAlias.verbChange', 'Change')

    return (
      <Dialog
        id="change-repository-alias"
        title={
          __DARWIN__
            ? t('repositoryAlias.titleDarwin', '{{verb}} Repository Alias', {
                verb,
              })
            : t('repositoryAlias.titleOther', '{{verb}} repository alias', {
                verb,
              })
        }
        ariaDescribedBy="change-repository-alias-description"
        onDismissed={this.props.onDismissed}
        onSubmit={this.changeAlias}
      >
        <DialogContent>
          <p id="change-repository-alias-description">
            {t(
              'repositoryAlias.description',
              'Choose a new alias for the repository "{{repositoryName}}".',
              { repositoryName: nameOf(repository) }
            )}
          </p>
          <p>
            <TextBox
              ariaLabel={t('repositoryAlias.ariaLabel', 'Alias')}
              value={this.state.newAlias}
              onValueChanged={this.onNameChanged}
            />
          </p>
          {repository.gitHubRepository !== null && (
            <p className="description">
              {t(
                'repositoryAlias.noImpactOnGitHub',
                'This will not affect the original repository name on GitHub.'
              )}
            </p>
          )}
        </DialogContent>

        <DialogFooter>
          <OkCancelButtonGroup
            okButtonText={
              __DARWIN__
                ? t('repositoryAlias.okButtonDarwin', '{{verb}} Alias', {
                    verb,
                  })
                : t('repositoryAlias.okButtonOther', '{{verb}} alias', { verb })
            }
            okButtonDisabled={this.state.newAlias.length === 0}
          />
        </DialogFooter>
      </Dialog>
    )
  }

  private onNameChanged = (newAlias: string) => {
    this.setState({ newAlias })
  }

  private changeAlias = () => {
    this.props.dispatcher.changeRepositoryAlias(
      this.props.repository,
      this.state.newAlias
    )
    this.props.onDismissed()
  }
}

export const ChangeRepositoryAlias = withTranslation()(
  ChangeRepositoryAliasInternal
) as unknown as React.ComponentClass<IChangeRepositoryAliasProps>
