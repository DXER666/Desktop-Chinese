import * as React from 'react'
import { Branch, BranchType } from '../../models/branch'

import { Row } from './row'
import { Octicon } from '../octicons'
import * as octicons from '../octicons/octicons.generated'
import { Ref } from './ref'
import { TFunction } from 'i18next'

export function renderBranchHasRemoteWarning(branch: Branch, t?: TFunction) {
  if (branch.upstream != null) {
    const prefix =
      t && t('renameBranch.trackingWarningPrefix', 'This branch is tracking ')
    const suffix =
      t &&
      t(
        'renameBranch.trackingWarningSuffix',
        ' and renaming this branch will not change the branch name on the remote.'
      )
    const fallbackPrefix = 'This branch is tracking '
    const fallbackSuffix =
      ' and renaming this branch will not change the branch name on the remote.'
    return (
      <Row className="warning-helper-text">
        <Octicon symbol={octicons.alert} />
        <p>
          {t ? prefix : fallbackPrefix}
          <Ref>{branch.upstream}</Ref>
          {t ? suffix : fallbackSuffix}
        </p>
      </Row>
    )
  } else {
    return null
  }
}

export function renderBranchNameExistsOnRemoteWarning(
  sanitizedName: string,
  branches: ReadonlyArray<Branch>,
  t?: TFunction
) {
  const alreadyExistsOnRemote =
    branches.findIndex(
      b => b.nameWithoutRemote === sanitizedName && b.type === BranchType.Remote
    ) > -1

  if (alreadyExistsOnRemote === false) {
    return null
  }

  const prefix =
    t && t('branchNameWarnings.nameExistsOnRemotePrefix', 'A branch named ')
  const suffix =
    t &&
    t(
      'branchNameWarnings.nameExistsOnRemoteSuffix',
      ' already exists on the remote.'
    )

  const fallbackPrefix = 'A branch named '
  const fallbackSuffix = ' already exists on the remote.'

  return (
    <Row className="warning-helper-text">
      <Octicon symbol={octicons.alert} />
      <p>
        {t ? prefix : fallbackPrefix}
        <Ref>{sanitizedName}</Ref>
        {t ? suffix : fallbackSuffix}
      </p>
    </Row>
  )
}
