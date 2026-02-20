import { configManager } from '../../utils/config-manager'
import { devError } from '../../utils/dev'

export default defineEventHandler(async (event) => {
  try {
    const host = configManager.getSetting('trimedia_host')
    const username = configManager.getSetting('trimedia_username')
    const password = configManager.getSetting('trimedia_password')
    const enabled = configManager.getSetting('trimedia_enabled')
    
    return {
      success: true,
      data: {
        host: host || '',
        username: username || '',
        password: password || '',
        enabled: enabled === 'true'
      }
    }
  } catch (error) {
    devError('get_trimedia_settings_failed', error)
    return { success: false, message: 'get_trimedia_settings_failed' }
  }
})
