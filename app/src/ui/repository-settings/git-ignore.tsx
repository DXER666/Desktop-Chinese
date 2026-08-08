import * as React from 'react'
import { DialogContent } from '../dialog'
import { TextArea } from '../lib/text-area'
import { LinkButton } from '../lib/link-button'
import { Ref } from '../lib/ref'
import { withTranslation, WithTranslation } from 'react-i18next'

interface IGitIgnoreProps {
  readonly text: string | null
  readonly onIgnoreTextChanged: (text: string) => void
  readonly onShowExamples: () => void
}

/** A view for creating or modifying the repository's gitignore file */
class GitIgnoreInternal extends React.Component<
  IGitIgnoreProps & WithTranslation,
  {}
> {
  public render() {
    const { t } = this.props
    return (
      <DialogContent>
        <p id="ignored-files-description">
          {t(
            'repositorySettings.ignoredFiles.descriptionPrefix',
            'Editing '
          )}
          <Ref>.gitignore</Ref>
          {t(
            'repositorySettings.ignoredFiles.descriptionSuffix',
            '. This file specifies intentionally untracked files that Git should ignore. Files already tracked by Git are not affected. '
          )}
          <LinkButton onClick={this.props.onShowExamples}>
            {t(
              'repositorySettings.ignoredFiles.learnMore',
              'Learn more about gitignore files'
            )}
          </LinkButton>
        </p>

        <TextArea
          ariaLabel={t(
            'repositorySettings.ignoredFiles.ariaLabel',
            'Ignored files'
          )}
          ariaDescribedBy="ignored-files-description"
          placeholder={t(
            'repositorySettings.ignoredFiles.placeholder',
            'Ignored files'
          )}
          value={this.props.text || ''}
          onValueChanged={this.props.onIgnoreTextChanged}
          textareaClassName="gitignore"
        />
      </DialogContent>
    )
  }
}

export const GitIgnore = withTranslation()(
  GitIgnoreInternal
) as unknown as React.ComponentClass<IGitIgnoreProps>
