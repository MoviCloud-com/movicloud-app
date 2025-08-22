// 国家/地区翻译工具
import { t } from './useI18n'

export const useCountryTranslation = () => {

  // 语言代码到翻译键的映射
  const languageToCountryKey: Record<string, string> = {
    'en': 'country_usa',
    'zh': 'country_china',
    'ja': 'country_japan',
    'ko': 'country_korea',
    'fr': 'country_france',
    'de': 'country_germany',
    'es': 'country_spain',
    'it': 'country_italy',
    'ru': 'country_russia',
    'hi': 'country_india',
    'pt': 'country_brazil',
    'nl': 'country_netherlands',
    'sv': 'country_sweden',
    'no': 'country_norway',
    'da': 'country_denmark',
    'fi': 'country_finland',
    'pl': 'country_poland',
    'cs': 'country_czech',
    'hu': 'country_hungary',
    'ro': 'country_romania',
    'bg': 'country_bulgaria',
    'hr': 'country_croatia',
    'sr': 'country_serbia',
    'sl': 'country_slovenia',
    'sk': 'country_slovakia',
    'et': 'country_estonia',
    'lv': 'country_latvia',
    'lt': 'country_lithuania',
    'th': 'country_thailand',
    'id': 'country_indonesia'
  }

  // 获取国家/地区名称
  const getCountryName = (languageCode: string): string => {
    const translationKey = languageToCountryKey[languageCode.toLowerCase()]
    if (translationKey) {
      return t(translationKey)
    }
    // 如果没有找到翻译，返回大写的语言代码
    return languageCode.toUpperCase()
  }

  // 获取多个国家/地区名称
  const getCountryNames = (languageCodes: string[]): string[] => {
    return languageCodes.map(code => getCountryName(code))
  }

  return {
    getCountryName,
    getCountryNames
  }
} 