import { configManager } from '../../utils/config-manager'
import { devError } from '../../utils/dev'

export default defineEventHandler(async (event) => {
  try {
    const siteName = configManager.getSetting('site_name') || 'MoviCloud'
    const siteDescription = configManager.getSetting('site_description') || '影视云盘'
    const themeMode = configManager.getSetting('theme_mode') || 'auto'
    const language = configManager.getSetting('language') || 'zh-CN'
    
    return {
      success: true,
      data: { siteName, siteDescription, themeMode, language }
    }
  } catch (error: any) {
    devError('get_general_settings_failed', error)
    return { success: false, message: 'get_general_settings_failed' }
  }
}) 