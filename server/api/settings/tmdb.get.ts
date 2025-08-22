import { dbManager } from '../../database/database'
import { devError } from '../../utils/dev'

export default defineEventHandler(async (event) => {
  try {
    const apiKey = await dbManager.getSetting('tmdb_api_key')
    const apiBaseUrl = await dbManager.getSetting('tmdb_api_base_url')
    const imageBaseUrl = await dbManager.getSetting('tmdb_image_base_url')
    const proxyEnabled = await dbManager.getSetting('proxy_enabled')
    const proxyUrl = await dbManager.getSetting('proxy_url')
    
    return {
      success: true,
      data: {
        apiKey: apiKey || '',
        apiBaseUrl: apiBaseUrl || 'https://api.tmdb.org',
        imageBaseUrl: imageBaseUrl || 'https://image.tmdb.org',
        proxyEnabled: proxyEnabled === '1',
        proxyUrl: proxyUrl || ''
      }
    }
  } catch (error) {
    devError('get_tmdb_settings_failed', error)
    return { success: false, message: 'get_tmdb_settings_failed' }
  }
}) 