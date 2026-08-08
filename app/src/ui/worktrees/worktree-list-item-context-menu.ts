import * as Path from 'path'

import { IMenuItem } from '../../lib/menu-item'
import { clipboard } from 'electron'
import i18next from 'i18next'

interface IWorktreeContextMenuConfig {
  readonly path: string
  readonly isMainWorktree: boolean
  readonly isLocked: boolean
  readonly onRenameWorktree?: (path: string) => void
  readonly onRemoveWorktree?: (path: string) => void
}

export function generateWorktreeContextMenuItems(
  config: IWorktreeContextMenuConfig
): ReadonlyArray<IMenuItem> {
  const { path, isMainWorktree, isLocked, onRenameWorktree, onRemoveWorktree } =
    config
  const t = i18next.t.bind(i18next)
  const name = Path.basename(path)
  const items = new Array<IMenuItem>()

  if (onRenameWorktree !== undefined) {
    items.push({
      label: t('contextMenu.rename', { defaultValue: 'Rename…' }),
      action: () => onRenameWorktree(path),
      enabled: !isMainWorktree && !isLocked,
    })
  }

  items.push({
    label: __DARWIN__
      ? t('contextMenu.copyWorktreeNameDarwin', {
          defaultValue: 'Copy Worktree Name',
        })
      : t('contextMenu.copyWorktreeNameOther', {
          defaultValue: 'Copy worktree name',
        }),
    action: () => clipboard.writeText(name),
  })

  items.push({
    label: __DARWIN__
      ? t('contextMenu.copyWorktreePathDarwin', {
          defaultValue: 'Copy Worktree Path',
        })
      : t('contextMenu.copyWorktreePathOther', {
          defaultValue: 'Copy worktree path',
        }),
    action: () => clipboard.writeText(path),
  })

  items.push({ type: 'separator' })

  if (onRemoveWorktree !== undefined) {
    items.push({
      label: t('contextMenu.delete', { defaultValue: 'Delete…' }),
      action: () => onRemoveWorktree(path),
      enabled: !isMainWorktree && !isLocked,
    })
  }

  return items
}
