import { dbManager } from '../../database/database'
import { devError } from '../../utils/dev'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { siteName, siteDescription, themeMode, language } = body

    if (siteName !== undefined) await dbManager.setSetting('site_name', siteName)
    if (siteDescription !== undefined) await dbManager.setSetting('site_description', siteDescription)
    if (themeMode !== undefined) await dbManager.setSetting('theme_mode', themeMode)
    if (language !== undefined) await dbManager.setSetting('language', language)

    return { success: true, message: 'general_settings_saved' }
  } catch (error: any) {
    devError('general_settings_save_failed', error)
    return { success: false, message: 'general_settings_save_failed' }
  }
}) 