import { IMenuItem } from '../../lib/menu-item'
import i18next from 'i18next'

interface IPullRequestContextMenuConfig {
  onViewPullRequestOnGitHub?: () => void
  onCheckoutInNewWorktree?: () => void
}

export function generatePullRequestContextMenuItems(
  config: IPullRequestContextMenuConfig
): IMenuItem[] {
  const { onViewPullRequestOnGitHub, onCheckoutInNewWorktree } = config
  const t = i18next.t.bind(i18next)
  const items = new Array<IMenuItem>()

  if (onViewPullRequestOnGitHub !== undefined) {
    items.push({
      label: t('contextMenu.viewPullRequestOnGitHub', {
        defaultValue: 'View Pull Request on GitHub',
      }),
      action: () => onViewPullRequestOnGitHub(),
    })
  }

  if (onCheckoutInNewWorktree !== undefined) {
    items.push({
      label: __DARWIN__
        ? t('contextMenu.checkoutInNewWorktreeDarwin', {
            defaultValue: 'Checkout in New Worktree…',
          })
        : t('contextMenu.checkoutInNewWorktreeOther', {
            defaultValue: 'Checkout in new worktree…',
          }),
      action: () => onCheckoutInNewWorktree(),
    })
  }

  return items
}
