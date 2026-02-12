import { configManager } from '../../utils/config-manager'
import { devError } from '../../utils/dev'

export default defineEventHandler(async (event) => {
  try {
    const cloudDriveSettings = configManager.getCloudDriveSettings()
    
    return {
      success: true,
      data: cloudDriveSettings
    }
  } catch (error) {
    devError('get_cloud_drive_settings_failed', error)
    return { success: false, message: 'get_cloud_drive_settings_failed' }
  }
}) 
