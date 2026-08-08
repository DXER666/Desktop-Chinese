import { format } from 'date-fns'
import { enableFormattingPreferences } from '../lib/feature-flag'

/**
 * 读取当前 i18n UI 语言（如 zh-CN / zh-TW / en-US）。
 * 找不到回退到浏览器语言。
 */
function getUILanguage(): string {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const i18n = require('../lib/i18n').default
    if (i18n && typeof i18n.language === 'string' && i18n.language.length > 0) {
      return i18n.language
    }
  } catch {
    /* 忽略 */
  }
  try {
    if (typeof navigator !== 'undefined' && navigator.language) {
      return navigator.language
    }
  } catch {
    /* 忽略 */
  }
  return 'en-US'
}

/**
 * 当前 UI 语言是否为中文（简体、繁体都算）。
 * 若是，需要使用不会输出英文月份缩写的日期模式、
 * 以及 24 小时制作为默认时间格式。
 */
function isChineseUI(): boolean {
  return /^zh[\b_-]/i.test(getUILanguage())
}

const localeCountryCode =
  new URL(location.href).hash.match(/lc=([A-Z]{2})/)?.[1] ?? null

/**
 * Countries that predominantly use 12-hour time format.
 *
 * Most of the world uses 24-hour time, so we list the exceptions here and
 * default to 24-hour for unlisted countries.
 */
const twelveHourCountries = new Set([
  'GB', // United Kingdom
  'IE', // Ireland
  'US', // United States
  'CA', // Canada (mixed, but 12-hour common)
  'AU', // Australia
  'NZ', // New Zealand
  'ZA', // South Africa
  'IN', // India
  'PK', // Pakistan
  'BD', // Bangladesh
  'PH', // Philippines
  'MX', // Mexico
  'CO', // Colombia
])

// Sourced from https://en.wikipedia.org/wiki/Decimal_separator
const decimalPointCountries = [
  'AU', // Australia
  'BS', // Bahamas, The
  'BD', // Bangladesh
  'BW', // Botswana
  // British West Indies - No single ISO code (historical region, now multiple countries)
  // Copilot expanded it to the following country codes
  ...[
    'AI', // Anguilla (British Overseas Territory)
    'AG', // Antigua and Barbuda
    'BS', // Bahamas
    'BB', // Barbados
    'BM', // Bermuda (British Overseas Territory)
    'VG', // British Virgin Islands (British Overseas Territory)
    'KY', // Cayman Islands (British Overseas Territory)
    'DM', // Dominica
    'GD', // Grenada
    'JM', // Jamaica
    'MS', // Montserrat (British Overseas Territory)
    'KN', // Saint Kitts and Nevis
    'LC', // Saint Lucia
    'VC', // Saint Vincent and the Grenadines
    'TT', // Trinidad and Tobago
    'TC', // Turks and Caicos Islands (British Overseas Territory)
    'GY', // Guyana (formerly British Guiana)
    'BZ', // Belize (formerly British Honduras)
  ],
  'KH', // Cambodia
  'CA', // Canada
  'CN', // China
  'CY', // Cyprus
  'DO', // Dominican Republic
  'EG', // Egypt
  'SV', // El Salvador
  'ET', // Ethiopia
  'GH', // Ghana
  'GT', // Guatemala
  'GY', // Guyana
  'HN', // Honduras
  'HK', // Hong Kong
  'IN', // India
  'IE', // Ireland
  'IL', // Israel
  'JM', // Jamaica
  'JP', // Japan
  'JO', // Jordan
  'KE', // Kenya
  'KP', // Korea, North
  'KR', // Korea, South
  'LY', // Libya
  'LI', // Liechtenstein
  'MO', // Macau
  'MY', // Malaysia
  'MV', // Maldives
  'MT', // Malta
  'MX', // Mexico
  'MM', // Myanmar
  'NA', // Namibia
  'NP', // Nepal
  'NZ', // New Zealand
  'NI', // Nicaragua
  'NG', // Nigeria
  'PK', // Pakistan
  'PA', // Panama
  'PH', // Philippines
  'RW', // Rwanda
  'QA', // Qatar
  'SA', // Saudi Arabia
  'SG', // Singapore
  'SO', // Somalia
  'LK', // Sri Lanka
  'CH', // Switzerland
  'SY', // Syria
  'TW', // Taiwan
  'TZ', // Tanzania
  'TH', // Thailand
  'UG', // Uganda
  'AE', // United Arab Emirates
  'GB', // United Kingdom
  'US', // United States
]

// Source: https://docs.oracle.com/cd/E19455-01/806-0169/overview-9/index.html
const commaDigitGroupingCountries = ['US', 'GB', 'TH']
const spaceDigitGroupingCountries = ['CA', 'DK', 'FI', 'SE', 'FR', 'DE']
const dotDigitGroupingCountries = ['IT', 'NO', 'ES']

function prefersTwelveHourTime(): boolean {
  return localeCountryCode == null || twelveHourCountries.has(localeCountryCode)
}

function prefersDecimalPoint(): boolean {
  return (
    localeCountryCode == null ||
    decimalPointCountries.includes(localeCountryCode)
  )
}

function preferredThousandsSeparator(): INumberFormat['thousandsSeparator'] {
  if (localeCountryCode === null) {
    return ''
  }

  if (commaDigitGroupingCountries.includes(localeCountryCode)) {
    return ','
  }

  if (spaceDigitGroupingCountries.includes(localeCountryCode)) {
    return ' '
  }

  if (dotDigitGroupingCountries.includes(localeCountryCode)) {
    return '.'
  }

  // Default to no digit grouping because some locales (e.g. India) use digit
  // grouping sizes that we can't handle right now and I suppose it's better to
  // show ungrouped numbers than incorrectly grouped ones.
  return ''
}

/**
 * A date format pattern compatible with date-fns format().
 */
export type DateFormat =
  | 'MMM d, yyyy'
  | 'MMMM do, yyyy'
  | 'MM/dd/yyyy'
  | 'dd/MM/yyyy'
  | 'dd-MM-yyyy'
  | 'dd.MM.yyyy'
  | 'yyyy/MM/dd'
  | 'yyyy-MM-dd'
  | 'yyyy.MM.dd'
  | 'MM/dd/yy'
  | 'dd/MM/yy'
  | 'dd-MM-yy'
  | 'dd.MM.yy'
  | 'yy/MM/dd'
  | 'yy-MM-dd'
  | 'yy.MM.dd'

/**
 * A time format pattern compatible with date-fns format().
 */
export type TimeFormat =
  | 'HH:mm:ss'
  | 'HH.mm.ss'
  | 'HH:mm'
  | 'HH.mm'
  | 'h:mm:ss aaa'
  | 'h.mm.ss aaa'
  | 'h:mm aaa'
  | 'h.mm aaa'

/**
 * Configuration for number formatting with separate thousands and decimal
 * separator characters.
 */
export interface INumberFormat {
  readonly thousandsSeparator: ',' | '.' | ' ' | ''
  readonly decimalSeparator: ',' | '.'
  readonly maximumFractionDigits?: number
}

/**
 * Any random date used for previewing date and time formats. This happens to be
 * the date of the 1.0 release of GitHub Desktop but it could be any date
 * (preferrably one where YYMMDD doesn't look the same as MMDDYY or DDMMYY to
 * avoid confusion in the previews). Similarly, the time portion should be
 * greater than 12:00 to make it clear when the 12-hour formats are used.
 */
const previewDate = new Date(2017, 9, 19, 14, 30, 45)
/**
 * All available date format patterns with their preview strings.
 */
export const dateFormats: ReadonlyArray<{
  readonly pattern: DateFormat
  readonly example: string
}> = (
  [
    'MMM d, yyyy',
    'MMMM do, yyyy',
    'MM/dd/yyyy',
    'dd/MM/yyyy',
    'dd-MM-yyyy',
    'dd.MM.yyyy',
    'yyyy/MM/dd',
    'yyyy-MM-dd',
    'yyyy.MM.dd',
    'MM/dd/yy',
    'dd/MM/yy',
    'dd-MM-yy',
    'dd.MM.yy',
    'yy/MM/dd',
    'yy-MM-dd',
    'yy.MM.dd',
  ] as const
).map(pattern => ({
  pattern,
  example: format(previewDate, pattern),
}))

/**
 * All available time format patterns with their preview strings.
 */
export const timeFormats: ReadonlyArray<{
  readonly pattern: TimeFormat
  readonly example: string
}> = (
  [
    'HH:mm:ss',
    'HH.mm.ss',
    'HH:mm',
    'HH.mm',
    'h:mm:ss aaa',
    'h.mm.ss aaa',
    'h:mm aaa',
    'h.mm aaa',
  ] as const
).map(pattern => ({
  pattern,
  example: format(previewDate, pattern),
}))

/**
 * All valid number format configurations with their preview strings.
 *
 * Excludes configurations where the thousands and decimal separator are the
 * same character.
 */
export const numberFormats: ReadonlyArray<INumberFormat> = [
  { thousandsSeparator: '', decimalSeparator: '.' },
  { thousandsSeparator: '', decimalSeparator: ',' },
  { thousandsSeparator: ',', decimalSeparator: '.' },
  { thousandsSeparator: '.', decimalSeparator: ',' },
  { thousandsSeparator: ' ', decimalSeparator: '.' },
  { thousandsSeparator: ' ', decimalSeparator: ',' },
]

/**
 * 如果用户没有在「设置 → 外观」中挑过日期/时间格式，就根据 UI 语言给出默认值：
 * - 中文 UI：默认 yyyy-MM-dd + 24h HH:mm（避免中文环境里出现「Aug 4, 2026」英文月份）
 * - 其它语言：保持原先的 `MMM d, yyyy` + 按 12h 国家判断的规则。
 */
export const defaultDateFormat: DateFormat = isChineseUI()
  ? 'yyyy-MM-dd'
  : 'MMM d, yyyy'
export const defaultTimeFormat: TimeFormat = isChineseUI()
  ? 'HH:mm'
  : prefersTwelveHourTime()
    ? 'h:mm aaa'
    : 'HH:mm'

export const defaultNumberFormat: INumberFormat = {
  thousandsSeparator: preferredThousandsSeparator(),
  decimalSeparator: prefersDecimalPoint() ? '.' : ',',
}

const dateFormatKey = 'dateFormat'
const timeFormatKey = 'timeFormat'
const numberFormatKey = 'numberFormat'

/** Get the user's preferred date format from localStorage. */
export function getDateFormatPreference(): DateFormat {
  const stored = localStorage.getItem(dateFormatKey)
  const match = dateFormats.find(f => f.pattern === stored)
  return match?.pattern ?? defaultDateFormat
}

/** Get the user's preferred time format from localStorage. */
export function getTimeFormatPreference(): TimeFormat {
  const stored = localStorage.getItem(timeFormatKey)
  const match = timeFormats.find(f => f.pattern === stored)
  return match?.pattern ?? defaultTimeFormat
}

/** Get the user's preferred number format from localStorage. */
export function getNumberFormatPreference(): INumberFormat {
  const key = localStorage.getItem(numberFormatKey)
  return key ? numberFormatFromKey(key) : defaultNumberFormat
}

/** Set the user's preferred date format in localStorage. */
export function setDateFormatPreference(format: DateFormat): void {
  localStorage.setItem(dateFormatKey, format)
}

/** Set the user's preferred time format in localStorage. */
export function setTimeFormatPreference(format: TimeFormat): void {
  localStorage.setItem(timeFormatKey, format)
}

/** Set the user's preferred number format in localStorage. */
export function setNumberFormatPreference(format: INumberFormat): void {
  localStorage.setItem(numberFormatKey, numberFormatToKey(format))
}

/**
 * Serialize a number format to a stable string key for use in select elements
 * and localStorage.
 */
export function numberFormatToKey(fmt: INumberFormat): string {
  return `${fmt.thousandsSeparator}|${fmt.decimalSeparator}`
}

/**
 * Deserialize a number format key back to an INumberFormat, returning the
 * default if the key is invalid.
 */
export function numberFormatFromKey(key: string): INumberFormat {
  const match = numberFormats.find(n => numberFormatToKey(n) === key)
  return match ?? defaultNumberFormat
}

const preferAbsoluteDatesKey = 'preferAbsoluteDates'

/**
 * Whether to prefer absolute dates over relative time in lists.
 * Defaults to false (i.e., relative time is shown by default).
 */
export function getPreferAbsoluteDates(): boolean {
  if (!enableFormattingPreferences()) {
    return false
  }

  return localStorage.getItem(preferAbsoluteDatesKey) === '1'
}

export function setPreferAbsoluteDates(value: boolean): void {
  localStorage.setItem(preferAbsoluteDatesKey, value ? '1' : '0')
}
