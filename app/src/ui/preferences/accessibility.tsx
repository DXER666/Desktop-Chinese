import * as React from 'react'
import {
  withTranslation,
  WithTranslation,
} from 'react-i18next'
import { DialogContent } from '../dialog'
import { Checkbox, CheckboxValue } from '../lib/checkbox'

interface IAccessibilityPreferencesProps {
  readonly underlineLinks: boolean
  readonly onUnderlineLinksChanged: (value: boolean) => void

  readonly showDiffCheckMarks: boolean
  readonly onShowDiffCheckMarksChanged: (value: boolean) => void
}

export class AccessibilityInternal extends React.Component<
  IAccessibilityPreferencesProps & WithTranslation,
  {}
> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public constructor(props: any) {
    super(props)
  }

  public render() {
    const { t } = this.props
    return (
      <DialogContent>
        <div className="accessibility-section">
          <h2>{t('preferences.accessibility.title')}</h2>
          <Checkbox
            label={t('preferences.accessibility.underlineLinks')}
            value={
              this.props.underlineLinks ? CheckboxValue.On : CheckboxValue.Off
            }
            onChange={this.onUnderlineLinksChanged}
            ariaDescribedBy="underline-setting-description"
          />
          <p
            id="underline-setting-description"
            className="settings-description"
          >
            {t('preferences.accessibility.underlineLinksDescription')}{' '}
            {this.renderExampleLink()}
          </p>

          <Checkbox
            label={t('preferences.accessibility.showCheckMarksInTheDiff')}
            value={
              this.props.showDiffCheckMarks
                ? CheckboxValue.On
                : CheckboxValue.Off
            }
            onChange={this.onShowDiffCheckMarksChanged}
            ariaDescribedBy="diff-checkmarks-setting-description"
          />
          <p
            id="diff-checkmarks-setting-description"
            className="settings-description"
          >
            {t(
              'preferences.accessibility.showCheckMarksInTheDiffDescription'
            )}
          </p>
        </div>
      </DialogContent>
    )
  }

  private renderExampleLink() {
    const { t } = this.props
    // The example link is rendered with inline style to override the global
    // underline setting since this is a non-interactive visual preview.
    const style = {
      textDecoration: this.props.underlineLinks ? 'underline' : 'none',
    }

    return (
      <span className="link-button-component example-link" style={style}>
        {t('preferences.accessibility.thisIsAnExampleLink')}
      </span>
    )
  }

  private onUnderlineLinksChanged = (
    event: React.FormEvent<HTMLInputElement>
  ) => {
    this.props.onUnderlineLinksChanged(event.currentTarget.checked)
  }

  private onShowDiffCheckMarksChanged = (
    event: React.FormEvent<HTMLInputElement>
  ) => {
    this.props.onShowDiffCheckMarksChanged(event.currentTarget.checked)
  }
}

export const Accessibility = withTranslation()(AccessibilityInternal)
