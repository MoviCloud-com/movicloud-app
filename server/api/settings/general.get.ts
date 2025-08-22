import { dbManager } from '../../database/database'
import { devError } from '../../utils/dev'

export default defineEventHandler(async (event) => {
  try {
    const siteName = await dbManager.getSetting('site_name') || 'MoviCloud'
    const siteDescription = await dbManager.getSetting('site_description') || '影视云盘'
    const themeMode = await dbManager.getSetting('theme_mode') || 'auto'
    const language = await dbManager.getSetting('language') || 'zh-CN'
    
    return {
      success: true,
      data: { siteName, siteDescription, themeMode, language }
    }
  } catch (error: any) {
    devError('get_general_settings_failed', error)
    return { success: false, message: 'get_general_settings_failed' }
  }
}) 