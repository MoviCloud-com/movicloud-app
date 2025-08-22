import { dbManager } from '../../database/database'
import { devError } from '../../utils/dev'

export default defineEventHandler(async (event) => {
  try {
    const apiKey = await dbManager.getSetting('tmdb_api_key')
    const apiBaseUrl = await dbManager.getSetting('tmdb_api_base_url')
    const imageBaseUrl = await dbManager.getSetting('tmdb_image_base_url')
    
    return { success: true, data: { apiKey, apiBaseUrl, imageBaseUrl } }
  } catch (error) {
    devError('get_tmdb_config_failed', error)
    return { success: false, message: 'get_tmdb_config_failed' }
  }
}) 