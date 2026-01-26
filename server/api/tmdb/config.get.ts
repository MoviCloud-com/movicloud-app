import { configManager } from '../../utils/config-manager'
import { devError } from '../../utils/dev'

export default defineEventHandler(async (event) => {
  try {
    const apiKey = configManager.getSetting('tmdb_api_key')
    const apiBaseUrl = configManager.getSetting('tmdb_api_base_url')
    const imageBaseUrl = configManager.getSetting('tmdb_image_base_url')
    
    return { success: true, data: { apiKey, apiBaseUrl, imageBaseUrl } }
  } catch (error) {
    devError('get_tmdb_config_failed', error)
    return { success: false, message: 'get_tmdb_config_failed' }
  }
}) 