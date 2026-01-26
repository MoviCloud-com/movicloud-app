import { configManager } from '../../utils/config-manager'
import { devError } from '../../utils/dev'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { apiKey, apiBaseUrl, imageBaseUrl } = body

    if (apiKey !== undefined) configManager.setSetting('tmdb_api_key', apiKey)
    if (apiBaseUrl !== undefined) configManager.setSetting('tmdb_api_base_url', apiBaseUrl)
    if (imageBaseUrl !== undefined) configManager.setSetting('tmdb_image_base_url', imageBaseUrl)

    return { success: true, message: 'tmdb_settings_saved' }
  } catch (error: any) {
    devError('tmdb_settings_save_failed', error)
    return { success: false, message: 'tmdb_settings_save_failed' }
  }
}) 