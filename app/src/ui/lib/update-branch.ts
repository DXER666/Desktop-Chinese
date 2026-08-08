import { TFunction } from 'i18next'
import { getCommitsBetweenCommits } from '../../lib/git'
import { promiseWithMinimumTimeout } from '../../lib/promise'
import { Branch } from '../../models/branch'
import { ComputedAction } from '../../models/computed-action'
import { MultiCommitOperationKind } from '../../models/multi-commit-operation'
import { RebasePreview } from '../../models/rebase'
import { Repository } from '../../models/repository'
import { IDropdownSelectButtonOption } from '../dropdown-select-button'

export function getMergeOptions(
  kind: MultiCommitOperationKind = MultiCommitOperationKind.Merge,
  initialOperation: MultiCommitOperationKind = MultiCommitOperationKind.Merge,
  confirmMergeAbbrev: string = 'Merge',
  updateBranch: (kind: MultiCommitOperationKind) => void = _k => void 0,
  t?: TFunction
): ReadonlyArray<IDropdownSelectButtonOption> {
  void kind
  void initialOperation
  void confirmMergeAbbrev
  void updateBranch
  const tt = t ?? ((key: string, fallback?: string) => fallback ?? key)
  return [
    {
      label: tt(
        'chooseBranchDialog.createMergeCommitLabel',
        'Create a merge commit'
      ),
      description: tt(
        'chooseBranchDialog.createMergeCommitDescription',
        'The commits from the selected branch will be added to the current branch via a merge commit.'
      ),
      id: MultiCommitOperationKind.Merge,
    },
    {
      label: tt('chooseBranchDialog.squashAndMergeLabel', 'Squash and merge'),
      description: tt(
        'chooseBranchDialog.squashAndMergeDescription',
        'The commits in the selected branch will be combined into one commit in the current branch.'
      ),
      id: MultiCommitOperationKind.Squash,
    },
    {
      label: tt('chooseBranchDialog.rebaseLabel', 'Rebase'),
      description: tt(
        'chooseBranchDialog.rebaseDescription',
        'The commits from the selected branch will be rebased and added to the current branch.'
      ),
      id: MultiCommitOperationKind.Rebase,
    },
  ]
}

export async function updateRebasePreview(
  baseBranch: Branch,
  targetBranch: Branch,
  repository: Repository,
  onUpdate: (rebasePreview: RebasePreview | null) => void
) {
  const computingRebaseForBranch = baseBranch.name

  onUpdate({
    kind: ComputedAction.Loading,
  })

  const commitsBehind = await promiseWithMinimumTimeout(
    () =>
      getCommitsBetweenCommits(
        repository,
        targetBranch.tip.sha,
        baseBranch.tip.sha
      ),
    500
  )

  const commitsAhead = await promiseWithMinimumTimeout(
    () =>
      getCommitsBetweenCommits(
        repository,
        baseBranch.tip.sha,
        targetBranch.tip.sha
      ),
    500
  )

  if (computingRebaseForBranch !== baseBranch.name) {
    onUpdate(null)
    return
  }

  if (commitsBehind === null) {
    onUpdate({
      kind: ComputedAction.Invalid,
    })
    return
  }

  onUpdate({
    kind: ComputedAction.Clean,
    commitsAhead: commitsAhead ?? [],
    commitsBehind: commitsBehind,
  })
}
