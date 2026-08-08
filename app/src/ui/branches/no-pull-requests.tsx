import * as React from 'react'
import { encodePathAsUrl } from '../../lib/path'
import { Ref } from '../lib/ref'
import { LinkButton } from '../lib/link-button'
import { withTranslation, WithTranslation } from 'react-i18next'

const BlankSlateImage = encodePathAsUrl(
  __dirname,
  'static/empty-no-pull-requests.svg'
)

interface INoPullRequestsProps {
  /** The name of the repository. */
  readonly repositoryName: string

  /** Is the default branch currently checked out? */
  readonly isOnDefaultBranch: boolean

  /** Is this component being rendered due to a search? */
  readonly isSearch: boolean

  /* Called when the user wants to create a new branch. */
  readonly onCreateBranch: () => void

  /** Called when the user wants to create a pull request. */
  readonly onCreatePullRequest: () => void

  /** Are we currently loading pull requests? */
  readonly isLoadingPullRequests: boolean
}

/** The placeholder for when there are no open pull requests. */
class NoPullRequestsImpl extends React.Component<
  INoPullRequestsProps & WithTranslation,
  {}
> {
  public render() {
    return (
      <div className="no-pull-requests">
        <img src={BlankSlateImage} className="blankslate-image" alt="" />
        {this.renderTitle()}
        {this.renderCallToAction()}
      </div>
    )
  }

  private renderTitle() {
    const { t } = this.props
    if (this.props.isSearch) {
      return (
        <div className="title">{t('pullRequestEmptyState.titleNotFound')}</div>
      )
    } else if (this.props.isLoadingPullRequests) {
      return <div className="title">{t('pullRequestEmptyState.titleLoading')}</div>
    } else {
      return (
        <div>
          <div className="title">{t('pullRequestEmptyState.titleAllSet')}</div>
          <div className="no-prs">
            {t('pullRequestEmptyState.noOpenPullRequestsPrefix')}
            <Ref>{this.props.repositoryName}</Ref>
            {t('pullRequestEmptyState.noOpenPullRequestsSuffix')}
          </div>
        </div>
      )
    }
  }

  private renderCallToAction() {
    const { t } = this.props
    if (this.props.isLoadingPullRequests) {
      return (
        <div className="call-to-action">
          {t('pullRequestEmptyState.loadingCallToAction')}
        </div>
      )
    }

    if (this.props.isOnDefaultBranch) {
      return (
        <div className="call-to-action">
          {t('pullRequestEmptyState.onDefaultBranchPrefix')}{' '}
          <LinkButton onClick={this.props.onCreateBranch}>
            {t('pullRequestEmptyState.onDefaultBranchCreate')}
          </LinkButton>{' '}
          {t('pullRequestEmptyState.onDefaultBranchSuffix')}
        </div>
      )
    } else {
      return (
        <div className="call-to-action">
          {t('pullRequestEmptyState.onFeatureBranchPrefix')}{' '}
          <LinkButton onClick={this.props.onCreatePullRequest}>
            {t('pullRequestEmptyState.onFeatureBranchCreate')}
          </LinkButton>{' '}
          {t('pullRequestEmptyState.onFeatureBranchSuffix')}
        </div>
      )
    }
  }
}

export const NoPullRequests = withTranslation()(NoPullRequestsImpl) as any
