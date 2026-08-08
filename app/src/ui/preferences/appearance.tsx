import * as React from 'react'
import { withTranslation, WithTranslation } from 'react-i18next'
import {
  ApplicationTheme,
  supportsSystemThemeChanges,
  getCurrentlyAppliedTheme,
} from '../lib/application-theme'
import { Row } from '../lib/row'
import { DialogContent } from '../dialog'
import { RadioGroup } from '../lib/radio-group'
import { Select } from '../lib/select'
import { Checkbox, CheckboxValue } from '../lib/checkbox'
import { encodePathAsUrl } from '../../lib/path'
import { tabSizeDefault } from '../../lib/stores/app-store'
import { enableFormattingPreferences } from '../../lib/feature-flag'
import {
  DateFormat,
  TimeFormat,
  INumberFormat,
  dateFormats,
  timeFormats,
  numberFormats,
  numberFormatToKey,
} from '../../models/formatting-preferences'
import { formatNumber } from '../../lib/format-number'
import {
  LanguagePreference,
  LanguagePreferenceLabels,
  SupportedLanguages,
  changeLanguageByPreference,
  getStoredLanguagePreference,
  setStoredLanguagePreference,
} from '../../lib/i18n'

interface IAppearanceProps {
  readonly selectedTheme: ApplicationTheme
  readonly onSelectedThemeChanged: (theme: ApplicationTheme) => void
  readonly selectedTabSize: number
  readonly onSelectedTabSizeChanged: (tabSize: number) => void
  readonly selectedDateFormat: DateFormat
  readonly onSelectedDateFormatChanged: (format: DateFormat) => void
  readonly selectedTimeFormat: TimeFormat
  readonly onSelectedTimeFormatChanged: (format: TimeFormat) => void
  readonly selectedNumberFormat: INumberFormat
  readonly onSelectedNumberFormatChanged: (format: INumberFormat) => void
  readonly preferAbsoluteDates: boolean
  readonly onPreferAbsoluteDatesChanged: (value: boolean) => void
}

interface IAppearanceState {
  readonly selectedTheme: ApplicationTheme | null
  readonly selectedTabSize: number
  readonly selectedLanguagePreference: LanguagePreference
}

class AppearanceInternal extends React.Component<
  IAppearanceProps & WithTranslation,
  IAppearanceState
> {
  public constructor(props: IAppearanceProps & WithTranslation) {
    super(props)

    const usePropTheme =
      props.selectedTheme !== ApplicationTheme.System ||
      supportsSystemThemeChanges()

    this.state = {
      selectedTheme: usePropTheme ? props.selectedTheme : null,
      selectedTabSize: props.selectedTabSize,
      selectedLanguagePreference: getStoredLanguagePreference(),
    }

    if (!usePropTheme) {
      this.initializeSelectedTheme()
    }
  }

  public async componentDidUpdate(prevProps: IAppearanceProps) {
    if (prevProps === this.props) {
      return
    }

    const usePropTheme =
      this.props.selectedTheme !== ApplicationTheme.System ||
      supportsSystemThemeChanges()

    const selectedTheme = usePropTheme
      ? this.props.selectedTheme
      : await getCurrentlyAppliedTheme()

    const selectedTabSize = this.props.selectedTabSize

    this.setState({ selectedTheme, selectedTabSize })
  }

  private initializeSelectedTheme = async () => {
    const selectedTheme = await getCurrentlyAppliedTheme()
    const selectedTabSize = this.props.selectedTabSize
    this.setState({ selectedTheme, selectedTabSize })
  }

  private onSelectedThemeChanged = (theme: ApplicationTheme) => {
    this.props.onSelectedThemeChanged(theme)
  }

  private onSelectedTabSizeChanged = (
    event: React.FormEvent<HTMLSelectElement>
  ) => {
    this.props.onSelectedTabSizeChanged(parseInt(event.currentTarget.value))
  }

  private onDateFormatChanged = (event: React.FormEvent<HTMLSelectElement>) => {
    const value = event.currentTarget.value
    const match = dateFormats.find(f => f.pattern === value)
    if (match !== undefined) {
      this.props.onSelectedDateFormatChanged(match.pattern)
    }
  }

  private onTimeFormatChanged = (event: React.FormEvent<HTMLSelectElement>) => {
    const value = event.currentTarget.value
    const match = timeFormats.find(f => f.pattern === value)
    if (match !== undefined) {
      this.props.onSelectedTimeFormatChanged(match.pattern)
    }
  }

  private onNumberFormatChanged = (
    event: React.FormEvent<HTMLSelectElement>
  ) => {
    const match = numberFormats.find(
      n => numberFormatToKey(n) === event.currentTarget.value
    )
    if (match) {
      this.props.onSelectedNumberFormatChanged(match)
    }
  }

  private onPreferAbsoluteDatesChanged = (
    event: React.FormEvent<HTMLInputElement>
  ) => {
    this.props.onPreferAbsoluteDatesChanged(event.currentTarget.checked)
  }

  private onLanguagePreferenceChanged = (
    event: React.FormEvent<HTMLSelectElement>
  ) => {
    const value = event.currentTarget.value as LanguagePreference
    const valid: ReadonlyArray<string> = ['system', ...SupportedLanguages]
    if (!valid.includes(value)) {
      return
    }
    setStoredLanguagePreference(value)
    this.setState({ selectedLanguagePreference: value })
    // 程序内即时切换：react-i18next 会通知所有订阅组件重新渲染
    changeLanguageByPreference(value).catch(err => {
      // eslint-disable-next-line no-console
      console.error('[i18n] failed to change language', err)
    })
  }

  private renderLanguage() {
    const { t } = this.props
    const options: ReadonlyArray<LanguagePreference> = [
      'system',
      ...SupportedLanguages,
    ]
    return (
      <div className="appearance-section">
        <h2 id="language-heading">{t('appearance.languageHeading')}</h2>
        <Select
          value={this.state.selectedLanguagePreference}
          label={t('appearance.languageLabel')}
          onChange={this.onLanguagePreferenceChanged}
        >
          {options.map(opt => (
            <option key={opt} value={opt}>
              {t(LanguagePreferenceLabels[opt])}
            </option>
          ))}
        </Select>
      </div>
    )
  }

  public renderThemeSwatch = (theme: ApplicationTheme) => {
    const { t } = this.props
    const darkThemeImage = encodePathAsUrl(__dirname, 'static/ghd_dark.svg')
    const lightThemeImage = encodePathAsUrl(__dirname, 'static/ghd_light.svg')

    switch (theme) {
      case ApplicationTheme.Light:
        return (
          <span>
            <img src={lightThemeImage} alt="" />
            <span className="theme-value-label">{t('appearance.themeLight')}</span>
          </span>
        )
      case ApplicationTheme.Dark:
        return (
          <span>
            <img src={darkThemeImage} alt="" />
            <span className="theme-value-label">{t('appearance.themeDark')}</span>
          </span>
        )
      case ApplicationTheme.System:
        /** Why three images? The system theme swatch uses the first image
         * positioned relatively to get the label container size and uses the
         * second and third positioned absolutely over first and third one
         * clipped in half to render a split dark and light theme swatch. */
        return (
          <span>
            <span className="system-theme-swatch">
              <img src={lightThemeImage} alt="" />
              <img src={lightThemeImage} alt="" />
              <img src={darkThemeImage} alt="" />
            </span>
            <span className="theme-value-label">{t('appearance.themeSystem')}</span>
          </span>
        )
    }
  }

  private renderSelectedTheme() {
    const { t } = this.props
    const selectedTheme = this.state.selectedTheme

    if (selectedTheme == null) {
      return <Row>{t('appearance.loadingSystemTheme')}</Row>
    }

    const themes = [
      ApplicationTheme.Light,
      ApplicationTheme.Dark,
      ...(supportsSystemThemeChanges() ? [ApplicationTheme.System] : []),
    ]

    return (
      <div className="appearance-section">
        <h2 id="theme-heading">{t('appearance.themeHeading')}</h2>

        <RadioGroup<ApplicationTheme>
          ariaLabelledBy="theme-heading"
          className="theme-selector"
          selectedKey={selectedTheme}
          radioButtonKeys={themes}
          onSelectionChanged={this.onSelectedThemeChanged}
          renderRadioButtonLabelContents={this.renderThemeSwatch}
        />
      </div>
    )
  }

  private renderFormatting() {
    const { t } = this.props
    if (!enableFormattingPreferences()) {
      return null
    }

    return (
      <div className="appearance-section formatting-section">
        <h2 id="formatting-heading">{t('appearance.formattingHeading')}</h2>

        <Row>
          <Select
            label={__DARWIN__ ? t('appearance.dateFormatDarwin') : t('appearance.dateFormatOther')}
            value={this.props.selectedDateFormat}
            onChange={this.onDateFormatChanged}
          >
            {dateFormats.map(({ pattern, example }) => (
              <option key={pattern} value={pattern}>
                {example} ({pattern})
              </option>
            ))}
          </Select>

          <Select
            label={__DARWIN__ ? t('appearance.timeFormatDarwin') : t('appearance.timeFormatOther')}
            value={this.props.selectedTimeFormat}
            onChange={this.onTimeFormatChanged}
          >
            {timeFormats.map(({ pattern, example }) => (
              <option key={pattern} value={pattern}>
                {example} ({pattern})
              </option>
            ))}
          </Select>
        </Row>

        <Select
          label={__DARWIN__ ? t('appearance.numberFormatDarwin') : t('appearance.numberFormatOther')}
          value={numberFormatToKey(this.props.selectedNumberFormat)}
          onChange={this.onNumberFormatChanged}
        >
          {numberFormats.map(format => (
            <option
              key={numberFormatToKey(format)}
              value={numberFormatToKey(format)}
            >
              {formatNumber(1234567.89, format)}
            </option>
          ))}
        </Select>

        <Checkbox
          className="prefer-absolute-dates"
          label={t('appearance.preferAbsoluteDates')}
          value={
            this.props.preferAbsoluteDates
              ? CheckboxValue.On
              : CheckboxValue.Off
          }
          onChange={this.onPreferAbsoluteDatesChanged}
        />
      </div>
    )
  }

  private renderSelectedTabSize() {
    const { t } = this.props
    const availableTabSizes: number[] = [1, 2, 3, 4, 5, 6, 8, 10, 12]

    return (
      <div className="appearance-section">
        <h2 id="diff-heading">{t('appearance.diffHeading')}</h2>

        <Select
          value={this.state.selectedTabSize.toString()}
          label={__DARWIN__ ? t('appearance.tabSizeDarwin') : t('appearance.tabSizeOther')}
          onChange={this.onSelectedTabSizeChanged}
        >
          {availableTabSizes.map(n => (
            <option key={n} value={n}>
              {n === tabSizeDefault ? `${n} ${t('appearance.defaultTabSize')}` : n}
            </option>
          ))}
        </Select>
      </div>
    )
  }

  public render() {
    return (
      <DialogContent>
        {this.renderLanguage()}
        {this.renderSelectedTheme()}
        {this.renderFormatting()}
        {this.renderSelectedTabSize()}
      </DialogContent>
    )
  }
}

/**
 * 外观设置页面组件。
 * 通过 react-i18next 的 withTranslation 注入 t/i18n props，
 * 内部自己管理语言偏好（读/写 localStorage），不需要父组件传递。
 */
export const Appearance = withTranslation()(AppearanceInternal) as React.ComponentClass<IAppearanceProps>
