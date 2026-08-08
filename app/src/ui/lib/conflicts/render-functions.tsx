import * as React from 'react'
import { Octicon } from '../../octicons'
import * as octicons from '../../octicons/octicons.generated'
import { LinkButton } from '../link-button'
import i18n from '../../../lib/i18n'

export function renderUnmergedFilesSummary(conflictedFilesCount: number) {
  const t = i18n.t
  const message =
    conflictedFilesCount === 1
      ? t('conflicts.oneConflictedFile', '1 conflicted file')
      : t('conflicts.conflictedFiles', '{{count}} conflicted files', {
          count: conflictedFilesCount,
        })
  return <h2 className="summary">{message}</h2>
}

export function renderAllResolved() {
  const t = i18n.t
  return (
    <div className="all-conflicts-resolved">
      <div className="green-circle">
        <Octicon symbol={octicons.check} />
      </div>
      <div className="message">
        {t('conflicts.allConflictsResolved', 'All conflicts resolved')}
      </div>
    </div>
  )
}

export function renderShellLink(openThisRepositoryInShell: () => void) {
  const t = i18n.t
  return (
    <div>
      <LinkButton onClick={openThisRepositoryInShell}>
        {t('conflicts.openInCommandLine', 'Open in command line,')}
      </LinkButton>{' '}
      {t(
        'conflicts.resolveManuallyHint',
        'your tool of choice, or close to resolve manually.'
      )}
    </div>
  )
}
