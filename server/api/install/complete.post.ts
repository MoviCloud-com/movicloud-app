import { dbManager } from '../../database/database'
import { generateSystemId } from '../../utils/system-id'
import { devLog, devError } from '../../utils/dev'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { tmdbApiKey, tmdbApiBaseUrl, tmdbImageBaseUrl, proxyEnabled, httpProxy, httpsProxy, allProxy, username, nickname, password } = body

    if (!tmdbApiKey || !username || !password) {
      return { success: false, message: 'all_fields_required' }
    }

    devLog('init_db_start')
    await dbManager.initialize()
    devLog('init_db_done')

    if (password.length < 6) {
      return { success: false, message: 'password_too_short' }
    }

    const isInstalled = await dbManager.isInstalled()
    if (isInstalled) {
      return { success: false, message: 'already_installed' }
    }

    await dbManager.setSetting('tmdb_api_key', tmdbApiKey)
    await dbManager.setSetting('tmdb_api_base_url', tmdbApiBaseUrl)
    await dbManager.setSetting('tmdb_image_base_url', tmdbImageBaseUrl)
    await dbManager.setSetting('proxy_enabled', proxyEnabled ? '1' : '0')
    
    if (proxyEnabled) {
      if (httpProxy) await dbManager.setSetting('http_proxy', httpProxy)
      if (httpsProxy) await dbManager.setSetting('https_proxy', httpsProxy)
      if (allProxy) await dbManager.setSetting('all_proxy', allProxy)
    }

    const systemId = generateSystemId()
    await dbManager.setSetting('system_id', systemId)
    
    await dbManager.createUser(username, password, nickname, 'admin')
    
    await dbManager.completeInstallation()

    return { success: true, message: 'installation_success', systemId }
  } catch (error) {
    devError('installation_failed', error)
    return { success: false, message: 'installation_failed' }
  }
}) 