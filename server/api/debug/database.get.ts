import { dbManager } from '../../database/database'
import { devError } from '../../utils/dev'

export default defineEventHandler(async (event) => {
  try {
    await dbManager.initialize()
    
    const tmdbApiKey = await dbManager.getSetting('tmdb_api_key')
    const tmdbApiBaseUrl = await dbManager.getSetting('tmdb_api_base_url')
    const tmdbImageBaseUrl = await dbManager.getSetting('tmdb_image_base_url')
    const proxyEnabled = await dbManager.getSetting('proxy_enabled')
    const proxyUrl = await dbManager.getSetting('proxy_url')
    
    const allSettings = await dbManager.getAllSettings()
    
    return {
      success: true,
      data: {
        databaseConnected: true,
        tmdbSettings: {
          apiKey: tmdbApiKey,
          apiBaseUrl: tmdbApiBaseUrl,
          imageBaseUrl: tmdbImageBaseUrl,
          proxyEnabled: proxyEnabled === '1',
          proxyUrl: proxyUrl
        },
        allSettings: allSettings
      }
    }
  } catch (error: any) {
    devError('database_debug_failed', error)
    return {
      success: false,
      message: 'database_debug_failed',
      error: error.message,
      data: { databaseConnected: false }
    }
  }
}) 