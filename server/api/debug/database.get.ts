import { configManager } from '../../utils/config-manager'
import { devError } from '../../utils/dev'

export default defineEventHandler(async (event) => {
  try {
    const tmdbApiKey = configManager.getSetting('tmdb_api_key')
    const tmdbApiBaseUrl = configManager.getSetting('tmdb_api_base_url')
    const tmdbImageBaseUrl = configManager.getSetting('tmdb_image_base_url')
    
    const allSettings = configManager.getAllSettings()
    const allUsers = configManager.getAllUsers()
    
    return {
      success: true,
      data: {
        configLoaded: true,
        tmdbSettings: {
          apiKey: tmdbApiKey,
          apiBaseUrl: tmdbApiBaseUrl,
          imageBaseUrl: tmdbImageBaseUrl
        },
        allSettings: allSettings,
        users: allUsers
      }
    }
  } catch (error: any) {
    devError('config_debug_failed', error)
    return {
      success: false,
      message: 'config_debug_failed',
      error: error.message,
      data: { configLoaded: false }
    }
  }
}) 