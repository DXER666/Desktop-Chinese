import i18next, { InitOptions } from 'i18next'
import { initReactI18next } from 'react-i18next'
import en from './locales/en.json'
import zhCN from './locales/zh-CN.json'

/** localStorage 存储用户语言偏好的 key */
export const I18N_STORAGE_KEY = 'desktop-i18n-language'

/** 支持的语言代码 */
export const SupportedLanguages = ['en', 'zh-CN'] as const
export type SupportedLanguage = typeof SupportedLanguages[number]

/**
 * 用户可能选择的值：
 * - 'system' = 跟随系统（由 LanguageDetector 自动判断 navigator / OS）
 * - SupportedLanguage = 显式指定某语言
 */
export type LanguagePreference = 'system' | SupportedLanguage

/** 语言偏好的可读标签 key（查 t('language.xxx')） */
export const LanguagePreferenceLabels: Record<LanguagePreference, string> = {
  system: 'language.system',
  en: 'language.en',
  'zh-CN': 'language.zh-CN',
}

/**
 * 读 localStorage 里用户选的语言偏好。
 * 返回 'system' 表示跟随系统，或具体语言代码。
 */
export function getStoredLanguagePreference(): LanguagePreference {
  try {
    const v = localStorage.getItem(I18N_STORAGE_KEY)
    if (
      v === 'system' ||
      (SupportedLanguages as ReadonlyArray<string>).includes(v || '')
    ) {
      return v as LanguagePreference
    }
  } catch {
    /* 忽略 */
  }
  return 'system'
}

/**
 * 写用户语言偏好到 localStorage。
 * 注意：真正把 i18next 切换到新语言需要调用 changeLanguageByPreference()。
 */
export function setStoredLanguagePreference(pref: LanguagePreference) {
  try {
    localStorage.setItem(I18N_STORAGE_KEY, pref)
  } catch {
    /* 忽略 */
  }
}

/**
 * 当用户选了 'system' 时，直接读取 navigator.language 判断：
 *   - zh / zh-CN / zh-Hans / zh-Hans-CN / zh-TW 等 → 'zh-CN'
 *   - 其他所有情况（en、ja、未知等）→ 'en'
 */
export function detectNavigatorLanguage(): SupportedLanguage {
  try {
    const nav = (typeof navigator !== 'undefined' && navigator.language) || 'en'
    if (/^zh(-|_|$)/i.test(nav)) {
      return 'zh-CN'
    }
  } catch {
    /* ignore */
  }
  return 'en'
}

/**
 * 把 preference 解析成实际的语言代码（不再返回 undefined，避免交给 detector 处理）。
 */
export function resolveInitialLanguage(
  pref: LanguagePreference
): SupportedLanguage {
  return pref === 'system'
    ? detectNavigatorLanguage()
    : (pref as SupportedLanguage)
}

/**
 * @deprecated 请使用 resolveInitialLanguage()。保留兼容外部调用。
 */
export function resolveLanguage(
  pref: LanguagePreference
): SupportedLanguage | undefined {
  return pref === 'system' ? undefined : pref
}

/**
 * 按偏好切换语言。
 * - 'system'：重新从 navigator 推断
 * - 具体语言：直接切换
 */
export async function changeLanguageByPreference(pref: LanguagePreference) {
  const lang = resolveInitialLanguage(pref)
  await i18next.changeLanguage(lang)
}

// 打包进 bundle 的静态资源（不用 http backend 读文件），
// 这样 Electron 打包后不需要额外拷贝 locales 目录。
const resources: InitOptions['resources'] = {
  en: { translation: en },
  'zh-CN': { translation: zhCN },
}

// 先把当前存储的偏好取出来，作为 lng 初始化值
const initialPreference = getStoredLanguagePreference()
const initialLng: SupportedLanguage = resolveInitialLanguage(initialPreference)

i18next
  // 不用 HttpBackend（资源已通过 resources 参数直接打包进 bundle）
  // 不用 LanguageDetector：detector 有时会把 zh-CN 当不支持的语言拒掉产生 warning；
  // 语言选择完全由我们自己的代码控制（initialPreference + resolveInitialLanguage）。
  .use(initReactI18next)
  .init({
    lng: initialLng,
    fallbackLng: 'en',
    supportedLngs: [...SupportedLanguages],
    nonExplicitSupportedLngs: false,
    resources,
    ns: ['translation'],
    defaultNS: 'translation',
    interpolation: {
      escapeValue: false, // React 已经 XSS 保护
    },
    debug: __DEV__,
  })

export default i18next
