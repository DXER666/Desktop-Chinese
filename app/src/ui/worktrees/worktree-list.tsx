import * as React from 'react'
import {
  WorktreeEntry,
  getWorktreeDescription,
  getWorktreeDisplayName,
} from '../../models/worktree'
import { IFilterListGroup, IFilterListItem } from '../lib/filter-list'
import { SectionFilterList } from '../lib/section-filter-list'
import { WorktreeListItem } from './worktree-list-item'
import { Button } from '../lib/button'
import { IMatches } from '../../lib/fuzzy-find'
import { ClickSource } from '../lib/list'
import memoizeOne from 'memoize-one'
import { withTranslation, WithTranslation } from 'react-i18next'

const RowHeight = 30

interface IWorktreeListItem extends IFilterListItem {
  readonly text: ReadonlyArray<string>
  readonly id: string
  readonly worktree: WorktreeEntry
}

interface IWorktreeListProps {
  readonly worktrees: ReadonlyArray<WorktreeEntry>
  readonly currentWorktree: WorktreeEntry | null

  readonly onWorktreeClick?: (
    worktree: WorktreeEntry,
    source: ClickSource
  ) => void
  readonly onFilterTextChanged: (text: string) => void
  readonly filterText: string
  readonly canCreateNewWorktree: boolean
  readonly onCreateNewWorktree?: () => void
  readonly onWorktreeContextMenu?: (
    worktree: WorktreeEntry,
    event: React.MouseEvent<HTMLDivElement>
  ) => void
}

type WorktreeGroupIdentifier = 'main' | 'linked'

class WorktreeListInternal extends React.Component<
  IWorktreeListProps & WithTranslation
> {
  private getGroups = memoizeOne((worktrees: ReadonlyArray<WorktreeEntry>) => {
    const groups: Array<
      IFilterListGroup<IWorktreeListItem, WorktreeGroupIdentifier>
    > = []

    const mainWorktree = worktrees.find(w => w.type === 'main')
    const linkedWorktrees = worktrees.filter(w => w.type === 'linked')

    if (mainWorktree) {
      groups.push({
        identifier: 'main',
        items: [
          {
            text: [getWorktreeDisplayName(mainWorktree)],
            id: mainWorktree.path,
            worktree: mainWorktree,
          },
        ],
      })
    }

    if (linkedWorktrees.length > 0) {
      groups.push({
        identifier: 'linked',
        items: linkedWorktrees.map(w => ({
          text: [getWorktreeDisplayName(w)],
          id: w.path,
          worktree: w,
        })),
      })
    }

    return groups
  })

  private renderItem = (item: IWorktreeListItem, matches: IMatches) => {
    return (
      <WorktreeListItem
        worktree={item.worktree}
        isCurrentWorktree={
          this.props.currentWorktree !== null &&
          this.props.currentWorktree.path === item.worktree.path
        }
        matches={matches}
      />
    )
  }

  private getGroupLabel(identifier: WorktreeGroupIdentifier) {
    const { t } = this.props
    const worktreeSingular = __DARWIN__
      ? t('worktree.groupSingularDarwin', 'Worktree')
      : t('worktree.groupSingularOther', 'worktree')
    const worktreePlural = __DARWIN__
      ? t('worktree.groupPluralDarwin', 'Worktrees')
      : t('worktree.groupPluralOther', 'worktrees')
    return identifier === 'main'
      ? `${t('worktree.mainGroupPrefix', 'Main')} ${worktreeSingular}`
      : `${t('worktree.linkedGroupPrefix', 'Linked')} ${worktreePlural}`
  }

  private getGroupAriaLabel = (group: number) => {
    const identifier = this.getGroups(this.props.worktrees)[group].identifier
    return this.getGroupLabel(identifier)
  }

  private getItemAriaLabel = (item: IWorktreeListItem) => {
    const { worktree } = item
    return `${getWorktreeDisplayName(worktree)}, ${getWorktreeDescription(
      worktree
    )}`
  }

  private renderGroupHeader = (identifier: WorktreeGroupIdentifier) => {
    return (
      <div className="filter-list-group-header">
        {this.getGroupLabel(identifier)}
      </div>
    )
  }

  private onRenderNewButton = () => {
    const { t } = this.props
    if (!this.props.canCreateNewWorktree || !this.props.onCreateNewWorktree) {
      return null
    }
    return (
      <Button
        className="new-worktree-button"
        onClick={this.props.onCreateNewWorktree}
      >
        {__DARWIN__
          ? t('worktree.newButtonDarwin', 'New Worktree')
          : t('worktree.newButtonOther', 'New worktree')}
      </Button>
    )
  }

  private onRenderNoItems = () => {
    const { t } = this.props
    return (
      <div className="no-items-found">
        {t('worktree.noWorktrees', 'No worktrees found')}
      </div>
    )
  }

  private onItemClick = (item: IWorktreeListItem, source: ClickSource) => {
    if (this.props.onWorktreeClick) {
      this.props.onWorktreeClick(item.worktree, source)
    }
  }

  private onItemContextMenu = (
    item: IWorktreeListItem,
    event: React.MouseEvent<HTMLDivElement>
  ) => {
    if (this.props.onWorktreeContextMenu) {
      this.props.onWorktreeContextMenu(item.worktree, event)
    }
  }

  public render() {
    const groups = this.getGroups(this.props.worktrees)

    return (
      <SectionFilterList<IWorktreeListItem, WorktreeGroupIdentifier>
        className="worktree-list"
        rowHeight={RowHeight}
        filterText={this.props.filterText}
        onFilterTextChanged={this.props.onFilterTextChanged}
        selectedItem={null}
        renderItem={this.renderItem}
        renderGroupHeader={this.renderGroupHeader}
        getItemAriaLabel={this.getItemAriaLabel}
        getGroupAriaLabel={this.getGroupAriaLabel}
        onItemClick={this.onItemClick}
        groups={groups}
        invalidationProps={this.props.worktrees}
        renderPostFilter={this.onRenderNewButton}
        renderNoItems={this.onRenderNoItems}
        onItemContextMenu={this.onItemContextMenu}
      />
    )
  }
}

export const WorktreeList = withTranslation()(
  WorktreeListInternal
) as unknown as React.ComponentClass<IWorktreeListProps>
