import * as React from 'react'
import {
  withTranslation,
  WithTranslation,
} from 'react-i18next'
import { UncommittedChangesStrategy } from '../../models/uncommitted-changes-strategy'
import { DialogContent } from '../dialog'
import { Checkbox, CheckboxValue } from '../lib/checkbox'
import { RadioGroup } from '../lib/radio-group'
import { assertNever } from '../../lib/fatal-error'

interface IPromptsPreferencesProps {
  readonly confirmRepositoryRemoval: boolean
  readonly confirmDiscardChanges: boolean
  readonly confirmDiscardChangesPermanently: boolean
  readonly confirmDiscardStash: boolean
  readonly confirmCheckoutCommit: boolean
  readonly confirmForcePush: boolean
  readonly confirmUndoCommit: boolean
  readonly askForConfirmationOnCommitFilteredChanges: boolean
  readonly confirmCommitMessageOverride: boolean
  readonly confirmWorktreeRemoval: boolean
  readonly showCommitLengthWarning: boolean
  readonly uncommittedChangesStrategy: UncommittedChangesStrategy
  readonly onConfirmDiscardChangesChanged: (checked: boolean) => void
  readonly onConfirmDiscardChangesPermanentlyChanged: (checked: boolean) => void
  readonly onConfirmDiscardStashChanged: (checked: boolean) => void
  readonly onConfirmCheckoutCommitChanged: (checked: boolean) => void
  readonly onConfirmRepositoryRemovalChanged: (checked: boolean) => void
  readonly onConfirmForcePushChanged: (checked: boolean) => void
  readonly onConfirmUndoCommitChanged: (checked: boolean) => void
  readonly onShowCommitLengthWarningChanged: (checked: boolean) => void
  readonly onUncommittedChangesStrategyChanged: (
    value: UncommittedChangesStrategy
  ) => void
  readonly onAskForConfirmationOnCommitFilteredChanges: (value: boolean) => void
  readonly onConfirmCommitMessageOverrideChanged: (checked: boolean) => void
  readonly onConfirmWorktreeRemovalChanged: (checked: boolean) => void
}

interface IPromptsPreferencesState {
  readonly confirmRepositoryRemoval: boolean
  readonly confirmDiscardChanges: boolean
  readonly confirmDiscardChangesPermanently: boolean
  readonly confirmDiscardStash: boolean
  readonly confirmCheckoutCommit: boolean
  readonly confirmForcePush: boolean
  readonly confirmUndoCommit: boolean
  readonly askForConfirmationOnCommitFilteredChanges: boolean
  readonly confirmCommitMessageOverride: boolean
  readonly confirmWorktreeRemoval: boolean
  readonly uncommittedChangesStrategy: UncommittedChangesStrategy
}

export class PromptsInternal extends React.Component<
  IPromptsPreferencesProps & WithTranslation,
  IPromptsPreferencesState
> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public constructor(props: any) {
    super(props)

    this.state = {
      confirmRepositoryRemoval: this.props.confirmRepositoryRemoval,
      confirmDiscardChanges: this.props.confirmDiscardChanges,
      confirmDiscardChangesPermanently:
        this.props.confirmDiscardChangesPermanently,
      confirmDiscardStash: this.props.confirmDiscardStash,
      confirmCheckoutCommit: this.props.confirmCheckoutCommit,
      confirmForcePush: this.props.confirmForcePush,
      confirmUndoCommit: this.props.confirmUndoCommit,
      uncommittedChangesStrategy: this.props.uncommittedChangesStrategy,
      askForConfirmationOnCommitFilteredChanges:
        this.props.askForConfirmationOnCommitFilteredChanges,
      confirmCommitMessageOverride: this.props.confirmCommitMessageOverride,
      confirmWorktreeRemoval: this.props.confirmWorktreeRemoval,
    }
  }

  private onConfirmDiscardChangesChanged = (
    event: React.FormEvent<HTMLInputElement>
  ) => {
    const value = event.currentTarget.checked

    this.setState({ confirmDiscardChanges: value })
    this.props.onConfirmDiscardChangesChanged(value)
  }

  private onConfirmDiscardChangesPermanentlyChanged = (
    event: React.FormEvent<HTMLInputElement>
  ) => {
    const value = event.currentTarget.checked

    this.setState({ confirmDiscardChangesPermanently: value })
    this.props.onConfirmDiscardChangesPermanentlyChanged(value)
  }

  private onConfirmDiscardStashChanged = (
    event: React.FormEvent<HTMLInputElement>
  ) => {
    const value = event.currentTarget.checked

    this.setState({ confirmDiscardStash: value })
    this.props.onConfirmDiscardStashChanged(value)
  }

  private onConfirmCheckoutCommitChanged = (
    event: React.FormEvent<HTMLInputElement>
  ) => {
    const value = event.currentTarget.checked

    this.setState({ confirmCheckoutCommit: value })
    this.props.onConfirmCheckoutCommitChanged(value)
  }

  private onConfirmForcePushChanged = (
    event: React.FormEvent<HTMLInputElement>
  ) => {
    const value = event.currentTarget.checked

    this.setState({ confirmForcePush: value })
    this.props.onConfirmForcePushChanged(value)
  }

  private onConfirmUndoCommitChanged = (
    event: React.FormEvent<HTMLInputElement>
  ) => {
    const value = event.currentTarget.checked

    this.setState({ confirmUndoCommit: value })
    this.props.onConfirmUndoCommitChanged(value)
  }

  private onAskForConfirmationOnCommitFilteredChanges = (
    event: React.FormEvent<HTMLInputElement>
  ) => {
    const value = event.currentTarget.checked

    this.setState({ askForConfirmationOnCommitFilteredChanges: value })
    this.props.onAskForConfirmationOnCommitFilteredChanges(value)
  }

  private onConfirmCommitMessageOverrideChanged = (
    event: React.FormEvent<HTMLInputElement>
  ) => {
    const value = event.currentTarget.checked

    this.setState({ confirmCommitMessageOverride: value })
    this.props.onConfirmCommitMessageOverrideChanged(value)
  }

  private onConfirmWorktreeRemovalChanged = (
    event: React.FormEvent<HTMLInputElement>
  ) => {
    const value = event.currentTarget.checked

    this.setState({ confirmWorktreeRemoval: value })
    this.props.onConfirmWorktreeRemovalChanged(value)
  }

  private onConfirmRepositoryRemovalChanged = (
    event: React.FormEvent<HTMLInputElement>
  ) => {
    const value = event.currentTarget.checked

    this.setState({ confirmRepositoryRemoval: value })
    this.props.onConfirmRepositoryRemovalChanged(value)
  }

  private onUncommittedChangesStrategyChanged = (
    value: UncommittedChangesStrategy
  ) => {
    this.setState({ uncommittedChangesStrategy: value })
    this.props.onUncommittedChangesStrategyChanged(value)
  }

  private onShowCommitLengthWarningChanged = (
    event: React.FormEvent<HTMLInputElement>
  ) => {
    this.props.onShowCommitLengthWarningChanged(event.currentTarget.checked)
  }

  private renderSwitchBranchOptionLabel = (
    key: UncommittedChangesStrategy
  ) => {
    const { t } = this.props
    switch (key) {
      case UncommittedChangesStrategy.AskForConfirmation:
        return t('preferences.prompts.askMeWhereChangesToGo')
      case UncommittedChangesStrategy.MoveToNewBranch:
        return t('preferences.prompts.alwaysBringMyChangesToNewBranch')
      case UncommittedChangesStrategy.StashOnCurrentBranch:
        return t(
          'preferences.prompts.alwaysStashAndLeaveMyChangesOnCurrentBranch'
        )
      default:
        return assertNever(
          key,
          `Unknown uncommitted changes strategy: ${key}`
        )
    }
  }

  private renderSwitchBranchOptions = () => {
    const { t } = this.props
    const options = [
      UncommittedChangesStrategy.AskForConfirmation,
      UncommittedChangesStrategy.MoveToNewBranch,
      UncommittedChangesStrategy.StashOnCurrentBranch,
    ]

    const selectedKey =
      options.find(o => o === this.state.uncommittedChangesStrategy) ??
      UncommittedChangesStrategy.AskForConfirmation

    return (
      <div className="advanced-section">
        <h2 id="switch-branch-heading">
          {t('preferences.prompts.ifIHaveChangesAndSwitchBranches')}
        </h2>

        <RadioGroup<UncommittedChangesStrategy>
          ariaLabelledBy="switch-branch-heading"
          selectedKey={selectedKey}
          radioButtonKeys={options}
          onSelectionChanged={this.onUncommittedChangesStrategyChanged}
          renderRadioButtonLabelContents={this.renderSwitchBranchOptionLabel}
        />
      </div>
    )
  }

  private renderCommittingFilteredChangesPrompt = () => {
    const { t } = this.props
    return (
      <Checkbox
        label={t('preferences.prompts.committingChangesHiddenByFilter')}
        value={
          this.state.askForConfirmationOnCommitFilteredChanges
            ? CheckboxValue.On
            : CheckboxValue.Off
        }
        onChange={this.onAskForConfirmationOnCommitFilteredChanges}
      />
    )
  }

  public render() {
    const { t } = this.props
    return (
      <DialogContent>
        <div className="advanced-section">
          <h2 id="show-confirm-dialog-heading">
            {t('preferences.prompts.showConfirmationDialogBefore')}
          </h2>
          <div role="group" aria-labelledby="show-confirm-dialog-heading">
            <Checkbox
              label={t('preferences.prompts.removingRepositories')}
              value={
                this.state.confirmRepositoryRemoval
                  ? CheckboxValue.On
                  : CheckboxValue.Off
              }
              onChange={this.onConfirmRepositoryRemovalChanged}
            />
            <Checkbox
              label={t('preferences.prompts.discardingChanges')}
              value={
                this.state.confirmDiscardChanges
                  ? CheckboxValue.On
                  : CheckboxValue.Off
              }
              onChange={this.onConfirmDiscardChangesChanged}
            />
            <Checkbox
              label={t('preferences.prompts.discardingChangesPermanently')}
              value={
                this.state.confirmDiscardChangesPermanently
                  ? CheckboxValue.On
                  : CheckboxValue.Off
              }
              onChange={this.onConfirmDiscardChangesPermanentlyChanged}
            />
            <Checkbox
              label={t('preferences.prompts.discardingStash')}
              value={
                this.state.confirmDiscardStash
                  ? CheckboxValue.On
                  : CheckboxValue.Off
              }
              onChange={this.onConfirmDiscardStashChanged}
            />
            <Checkbox
              label={t('preferences.prompts.checkingOutCommit')}
              value={
                this.state.confirmCheckoutCommit
                  ? CheckboxValue.On
                  : CheckboxValue.Off
              }
              onChange={this.onConfirmCheckoutCommitChanged}
            />
            <Checkbox
              label={t('preferences.prompts.forcePushing')}
              value={
                this.state.confirmForcePush ? CheckboxValue.On : CheckboxValue.Off
              }
              onChange={this.onConfirmForcePushChanged}
            />
            <Checkbox
              label={t('preferences.prompts.undoCommit')}
              value={
                this.state.confirmUndoCommit ? CheckboxValue.On : CheckboxValue.Off
              }
              onChange={this.onConfirmUndoCommitChanged}
            />
            <Checkbox
              label={t(
                'preferences.prompts.overridingCommitMessageWithGeneratedMessage'
              )}
              value={
                this.state.confirmCommitMessageOverride
                  ? CheckboxValue.On
                  : CheckboxValue.Off
              }
              onChange={this.onConfirmCommitMessageOverrideChanged}
            />
            <Checkbox
              label={t('preferences.prompts.removingWorktrees')}
              value={
                this.state.confirmWorktreeRemoval
                  ? CheckboxValue.On
                  : CheckboxValue.Off
              }
              onChange={this.onConfirmWorktreeRemovalChanged}
            />
            {this.renderCommittingFilteredChangesPrompt()}
          </div>
        </div>
        {this.renderSwitchBranchOptions()}
        <div className="advanced-section">
          <h2>{t('preferences.prompts.commitLength')}</h2>
          <Checkbox
            label={t('preferences.prompts.showCommitLengthWarning')}
            value={
              this.props.showCommitLengthWarning
                ? CheckboxValue.On
                : CheckboxValue.Off
            }
            onChange={this.onShowCommitLengthWarningChanged}
          />
        </div>
      </DialogContent>
    )
  }
}

export const Prompts = withTranslation()(PromptsInternal)
