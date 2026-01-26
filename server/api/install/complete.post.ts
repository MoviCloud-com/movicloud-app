import { configManager } from '../../utils/config-manager'
import { generateSystemId } from '../../utils/system-id'
import { devLog, devError } from '../../utils/dev'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { tmdbApiKey, tmdbApiBaseUrl, tmdbImageBaseUrl, username, nickname, password } = body

    if (!tmdbApiKey || !username || !password) {
      return { success: false, message: 'all_fields_required' }
    }

    devLog('init_config_start')

    if (password.length < 6) {
      return { success: false, message: 'password_too_short' }
    }

    const isInstalled = configManager.isInstalled()
    if (isInstalled) {
      return { success: false, message: 'already_installed' }
    }

    configManager.setSetting('tmdb_api_key', tmdbApiKey)
    configManager.setSetting('tmdb_api_base_url', tmdbApiBaseUrl || 'https://api.tmdb.org')
    configManager.setSetting('tmdb_image_base_url', tmdbImageBaseUrl || 'https://image.tmdb.org')

    const systemId = generateSystemId()
    configManager.setSetting('system_id', systemId)
    
    await configManager.createUser(username, password, nickname, 'admin')
    
    configManager.completeInstallation()

    devLog('init_config_done')

    return { success: true, message: 'installation_success', systemId }
  } catch (error) {
    devError('installation_failed', error)
    return { success: false, message: 'installation_failed' }
  }
}) 