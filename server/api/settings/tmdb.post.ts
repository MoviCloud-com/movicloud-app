import { dbManager } from '../../database/database'
import { devError } from '../../utils/dev'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { apiKey, apiBaseUrl, imageBaseUrl } = body

    if (apiKey !== undefined) await dbManager.setSetting('tmdb_api_key', apiKey)
    if (apiBaseUrl !== undefined) await dbManager.setSetting('tmdb_api_base_url', apiBaseUrl)
    if (imageBaseUrl !== undefined) await dbManager.setSetting('tmdb_image_base_url', imageBaseUrl)

    return { success: true, message: 'tmdb_settings_saved' }
  } catch (error: any) {
    devError('tmdb_settings_save_failed', error)
    return { success: false, message: 'tmdb_settings_save_failed' }
  }
}) 