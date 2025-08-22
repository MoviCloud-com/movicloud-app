import { ref, computed } from 'vue'

// 导入中文翻译模块
import { common as zhCommon } from './translations/zh-CN/common'
import { media as zhMedia } from './translations/zh-CN/media'
import { settings as zhSettings } from './translations/zh-CN/settings'
import { installation as zhInstallation } from './translations/zh-CN/installation'
import { debug as zhDebug } from './translations/zh-CN/debug'

// 导入英文翻译模块
import { common as enCommon } from './translations/en-US/common'
import { media as enMedia } from './translations/en-US/media'
import { settings as enSettings } from './translations/en-US/settings'
import { installation as enInstallation } from './translations/en-US/installation'
import { debug as enDebug } from './translations/en-US/debug'

// 导入繁体中文翻译模块
import { common as zhTWCommon } from './translations/zh-TW/common'
import { media as zhTWMedia } from './translations/zh-TW/media'
import { settings as zhTWSettings } from './translations/zh-TW/settings'
import { installation as zhTWInstallation } from './translations/zh-TW/installation'
import { debug as zhTWDebug } from './translations/zh-TW/debug'

// 支持的语言
export const supportedLanguages = [
  { code: 'zh-CN', name: '简体中文' },
  { code: 'zh-TW', name: '繁體中文' },
  { code: 'en-US', name: 'English' }
]

// 合并所有翻译
const translations = {
  'zh-CN': {
    ...zhCommon,
    ...zhMedia,
    ...zhSettings,
    ...zhInstallation,
    ...zhDebug
  },
  'zh-TW': {
    ...zhTWCommon,
    ...zhTWMedia,
    ...zhTWSettings,
    ...zhTWInstallation,
    ...zhTWDebug
  },
  'en-US': {
    ...enCommon,
    ...enMedia,
    ...enSettings,
    ...enInstallation,
    ...enDebug
  }
}

// 当前语言
const currentLanguage = ref('zh-CN')

// 设置语言
export const setLanguage = (lang: string) => {
  if (supportedLanguages.find(l => l.code === lang)) {
    currentLanguage.value = lang
    // 清除TMDB缓存，确保新语言的数据能正确加载
    // 注意：这里不能直接导入useTMDBClient，避免循环依赖
    // 缓存清除会在具体使用时处理
  }
}

// 获取翻译
export const t = (key: string, params?: Record<string, string>): string => {
  const lang = currentLanguage.value
  const langTranslations = translations[lang as keyof typeof translations]
  
  if (!langTranslations) {
    console.warn(`Translation not found for language: ${lang}`)
    return key
  }
  
  const translation = langTranslations[key as keyof typeof langTranslations]
  if (!translation) {
    console.warn(`Translation key not found: ${key} for language: ${lang}`)
    return key
  }
  
  // 如果有参数，进行替换
  if (params) {
    let result = translation
    for (const [param, value] of Object.entries(params)) {
      result = result.replace(new RegExp(`{${param}}`, 'g'), value)
    }
    return result
  }
  
  return translation
}

// 获取当前语言
export const getCurrentLanguage = () => currentLanguage.value

// 获取支持的语言列表
export const getSupportedLanguages = () => supportedLanguages

// 初始化语言设置
export const initLanguage = async () => {
  try {
    const response = await $fetch<{success: boolean, data: {language: string}}>('/api/settings/language')
    if (response.success) {
      currentLanguage.value = response.data.language
    }
  } catch (error) {
    console.warn('Failed to load language setting:', error)
  }
} 