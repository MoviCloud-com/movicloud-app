import { configManager } from '../../utils/config-manager'
import { devError } from '../../utils/dev'

export default defineEventHandler(async (event) => {
  try {
    const isInstalled = configManager.isInstalled()
    
    return { success: true, isInstalled, message: isInstalled ? 'already_installed' : 'not_installed' }
  } catch (error) {
    devError('install_check_failed', error)
    return { success: false, isInstalled: false, message: 'install_check_failed' }
  }
}) 