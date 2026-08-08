import i18next from 'i18next'

const RestrictedFileExtensions = ['.cmd', '.exe', '.bat', '.sh']

export function getCopyFilePathLabel(): string {
  return __DARWIN__
    ? i18next.t('contextMenu.copyFilePathDarwin')
    : i18next.t('contextMenu.copyFilePathOther')
}

export function getCopyRelativeFilePathLabel(): string {
  return __DARWIN__
    ? i18next.t('contextMenu.copyRelativeFilePathDarwin')
    : i18next.t('contextMenu.copyRelativeFilePathOther')
}

export function getCopySelectedPathsLabel(): string {
  return __DARWIN__
    ? i18next.t('contextMenu.copyPathsDarwin')
    : i18next.t('contextMenu.copyPathsOther')
}

export function getCopySelectedRelativePathsLabel(): string {
  return __DARWIN__
    ? i18next.t('contextMenu.copyRelativePathsDarwin')
    : i18next.t('contextMenu.copyRelativePathsOther')
}

export function getDefaultEditorLabel(): string {
  return __DARWIN__
    ? i18next.t('contextMenu.openInExternalEditorDarwin')
    : i18next.t('contextMenu.openInExternalEditorOther')
}

export function getDefaultShellLabel(): string {
  return __DARWIN__
    ? i18next.t('contextMenu.openInShellDarwin')
    : i18next.t('contextMenu.openInShellOther')
}

export function getRevealInFileManagerLabel(): string {
  return __DARWIN__
    ? i18next.t('contextMenu.revealInFinder')
    : __WIN32__
      ? i18next.t('contextMenu.showInExplorer')
      : i18next.t('contextMenu.showInFileManager')
}

export function getTrashNameLabel(): string {
  return __WIN32__
    ? i18next.t('contextMenu.recycleBin')
    : i18next.t('contextMenu.trash')
}

export function getOpenWithDefaultProgramLabel(): string {
  return __DARWIN__
    ? i18next.t('contextMenu.openWithDefaultProgramDarwin')
    : i18next.t('contextMenu.openWithDefaultProgramOther')
}

export function isSafeFileExtension(extension: string): boolean {
  if (__WIN32__) {
    return RestrictedFileExtensions.indexOf(extension.toLowerCase()) === -1
  }
  return true
}
