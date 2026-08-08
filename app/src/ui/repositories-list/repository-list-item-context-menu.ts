import { Repository } from '../../models/repository'
import { IMenuItem } from '../../lib/menu-item'
import { Repositoryish } from './group-repositories'
import { clipboard } from 'electron'
import i18next from 'i18next'
import {
  getRevealInFileManagerLabel,
  getDefaultEditorLabel,
  getDefaultShellLabel,
} from '../lib/context-menu'

interface IRepositoryListItemContextMenuConfig {
  repository: Repositoryish
  shellLabel: string | undefined
  externalEditorLabel: string | undefined
  askForConfirmationOnRemoveRepository: boolean
  onViewOnGitHub: (repository: Repositoryish) => void
  onOpenInShell: (repository: Repositoryish) => void
  onShowRepository: (repository: Repositoryish) => void
  onOpenInExternalEditor: (repository: Repositoryish) => void
  onRemoveRepository: (repository: Repositoryish) => void
  onChangeRepositoryAlias: (repository: Repository) => void
  onRemoveRepositoryAlias: (repository: Repository) => void
  onCreateWorktree?: (repository: Repository) => void
  onShowWorktrees?: (repository: Repository) => void
}

export const generateRepositoryListContextMenu = (
  config: IRepositoryListItemContextMenuConfig
) => {
  const { repository } = config
  const missing = repository instanceof Repository && repository.missing
  const github =
    repository instanceof Repository && repository.gitHubRepository != null
  const t = i18next.t.bind(i18next)
  const openInExternalEditor = config.externalEditorLabel
    ? __DARWIN__
      ? t('contextMenu.openInSpecificEditorDarwin', {
          editor: config.externalEditorLabel,
          defaultValue: `Open in ${config.externalEditorLabel}`,
        })
      : t('contextMenu.openInSpecificEditorOther', {
          editor: config.externalEditorLabel,
          defaultValue: `Open in ${config.externalEditorLabel}`,
        })
    : getDefaultEditorLabel()
  const openInShell = config.shellLabel
    ? __DARWIN__
      ? t('contextMenu.openInSpecificShellDarwin', {
          shell: config.shellLabel,
          defaultValue: `Open in ${config.shellLabel}`,
        })
      : t('contextMenu.openInSpecificShellOther', {
          shell: config.shellLabel,
          defaultValue: `Open in ${config.shellLabel}`,
        })
    : getDefaultShellLabel()

  const items: ReadonlyArray<IMenuItem> = [
    ...buildAliasMenuItems(config),
    ...buildWorktreeMenuItems(config),
    {
      label: __DARWIN__
        ? t('contextMenu.copyRepoNameDarwin', { defaultValue: 'Copy Repo Name' })
        : t('contextMenu.copyRepoNameOther', { defaultValue: 'Copy repo name' }),
      action: () => clipboard.writeText(repository.name),
    },
    {
      label: __DARWIN__
        ? t('contextMenu.copyRepoPathDarwin', { defaultValue: 'Copy Repo Path' })
        : t('contextMenu.copyRepoPathOther', { defaultValue: 'Copy repo path' }),
      action: () => clipboard.writeText(repository.path),
    },
    { type: 'separator' },
    {
      label: t('contextMenu.viewOnGitHub', { defaultValue: 'View on GitHub' }),
      action: () => config.onViewOnGitHub(repository),
      enabled: github,
    },
    {
      label: openInShell,
      action: () => config.onOpenInShell(repository),
      enabled: !missing,
    },
    {
      label: getRevealInFileManagerLabel(),
      action: () => config.onShowRepository(repository),
      enabled: !missing,
    },
    {
      label: openInExternalEditor,
      action: () => config.onOpenInExternalEditor(repository),
      enabled: !missing,
    },
    { type: 'separator' },
    {
      label: config.askForConfirmationOnRemoveRepository
        ? __DARWIN__
          ? t('contextMenu.removeWithConfirmationDarwin', {
              defaultValue: 'Remove…',
            })
          : t('contextMenu.removeWithConfirmationOther', {
              defaultValue: 'Remove…',
            })
        : __DARWIN__
          ? t('contextMenu.removeDarwin', { defaultValue: 'Remove' })
          : t('contextMenu.removeOther', { defaultValue: 'Remove' }),
      action: () => config.onRemoveRepository(repository),
    },
  ]

  return items
}

const buildAliasMenuItems = (
  config: IRepositoryListItemContextMenuConfig
): ReadonlyArray<IMenuItem> => {
  const { repository } = config
  const t = i18next.t.bind(i18next)

  if (!(repository instanceof Repository)) {
    return []
  }

  const verbKey = repository.alias == null ? 'verbCreate' : 'verbChange'
  const verb = t(`repositoryAlias.${verbKey}`, {
    defaultValue: repository.alias == null ? 'Create' : 'Change',
  })
  const items: Array<IMenuItem> = [
    {
      label: __DARWIN__
        ? t('contextMenu.changeOrCreateAliasDarwin', {
            verb,
            defaultValue: `${verb} Alias`,
          })
        : t('contextMenu.changeOrCreateAliasOther', {
            verb,
            defaultValue: `${verb} alias`,
          }),
      action: () => config.onChangeRepositoryAlias(repository),
    },
  ]

  if (repository.alias !== null) {
    items.push({
      label: __DARWIN__
        ? t('contextMenu.removeAliasDarwin', { defaultValue: 'Remove Alias' })
        : t('contextMenu.removeAliasOther', { defaultValue: 'Remove alias' }),
      action: () => config.onRemoveRepositoryAlias(repository),
    })
  }

  return items
}

const buildWorktreeMenuItems = (
  config: IRepositoryListItemContextMenuConfig
): ReadonlyArray<IMenuItem> => {
  const { repository, onCreateWorktree, onShowWorktrees } = config
  const t = i18next.t.bind(i18next)

  if (!(repository instanceof Repository)) {
    return []
  }

  if (onCreateWorktree === undefined && onShowWorktrees === undefined) {
    return []
  }

  const items: Array<IMenuItem> = []

  if (onShowWorktrees !== undefined) {
    items.push({
      label: __DARWIN__
        ? t('contextMenu.showWorktreesDarwin', { defaultValue: 'Show Worktrees' })
        : t('contextMenu.showWorktreesOther', { defaultValue: 'Show worktrees' }),
      action: () => onShowWorktrees(repository),
    })
  }

  if (onCreateWorktree !== undefined) {
    items.push({
      label: __DARWIN__
        ? t('contextMenu.newWorktreeDarwin', { defaultValue: 'New Worktree…' })
        : t('contextMenu.newWorktreeOther', { defaultValue: 'New worktree…' }),
      action: () => onCreateWorktree(repository),
    })
  }

  return items
}
