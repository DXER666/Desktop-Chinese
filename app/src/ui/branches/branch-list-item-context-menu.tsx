import { IMenuItem } from '../../lib/menu-item'
import { clipboard } from 'electron'
import { Branch, BranchType } from '../../models/branch'
import i18next from 'i18next'

interface IBranchContextMenuConfig {
  branch: Branch
  onRenameBranch?: (branchName: string) => void
  onViewBranchOnGitHub?: () => void
  onViewPullRequestOnGitHub?: () => void
  onDeleteBranch?: (branchName: string) => void
  onCheckoutInNewWorktree?: (branch: Branch) => void
}

export function generateBranchContextMenuItems(
  config: IBranchContextMenuConfig
): IMenuItem[] {
  const {
    branch,
    onRenameBranch,
    onViewBranchOnGitHub,
    onViewPullRequestOnGitHub,
    onDeleteBranch,
    onCheckoutInNewWorktree,
  } = config
  const t = i18next.t.bind(i18next)
  const items = new Array<IMenuItem>()

  if (onRenameBranch !== undefined) {
    items.push({
      label: t('contextMenu.rename', { defaultValue: 'Rename…' }),
      action: () => onRenameBranch(branch.name),
      enabled: branch.type === BranchType.Local,
    })
  }

  items.push({
    label: __DARWIN__
      ? t('contextMenu.copyBranchNameDarwin', {
          defaultValue: 'Copy Branch Name',
        })
      : t('contextMenu.copyBranchNameOther', {
          defaultValue: 'Copy branch name',
        }),
    action: () => clipboard.writeText(branch.name),
  })

  if (onViewBranchOnGitHub !== undefined) {
    items.push({
      label: t('contextMenu.viewBranchOnGitHub', {
        defaultValue: 'View Branch on GitHub',
      }),
      action: () => onViewBranchOnGitHub(),
    })
  }

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
      action: () => onCheckoutInNewWorktree(branch),
    })
  }

  items.push({ type: 'separator' })

  if (onDeleteBranch !== undefined) {
    items.push({
      label: t('contextMenu.delete', { defaultValue: 'Delete…' }),
      action: () => onDeleteBranch(branch.name),
    })
  }

  return items
}
