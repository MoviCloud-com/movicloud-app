import { configManager } from '../../utils/config-manager'
import { devLog, devWarn, devError } from '../../utils/dev'

export default defineEventHandler(async (event) => {
  try {
    const systemId = configManager.getSetting('system_id')
    
    if (!systemId) {
      devWarn('system_id_not_found')
      return { success: false, error: 'system_id_not_found', message: 'system_id_missing', timestamp: Date.now(), source: 'not_found' }
    }
    
    devLog('system_id_loaded', systemId)
    
    return { success: true, system_id: systemId, message: 'system_id_load_success', timestamp: Date.now(), source: 'config' }
  } catch (error) {
    devError('get_system_id_failed', error)
    return { success: false, error: 'get_system_id_failed', message: 'get_system_id_failed', timestamp: Date.now(), source: 'error' }
  }
})
