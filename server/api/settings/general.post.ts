import { configManager } from '../../utils/config-manager'
import { devError } from '../../utils/dev'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { siteName, siteDescription, themeMode, language } = body

    if (siteName !== undefined) configManager.setSetting('site_name', siteName)
    if (siteDescription !== undefined) configManager.setSetting('site_description', siteDescription)
    if (themeMode !== undefined) configManager.setSetting('theme_mode', themeMode)
    if (language !== undefined) configManager.setSetting('language', language)

    return { success: true, message: 'general_settings_saved' }
  } catch (error: any) {
    devError('general_settings_save_failed', error)
    return { success: false, message: 'general_settings_save_failed' }
  }
}) 