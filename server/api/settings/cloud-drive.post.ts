import { configManager } from '../../utils/config-manager'
import { devError } from '../../utils/dev'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    
    configManager.setCloudDriveSettings(body)
    
    return {
      success: true,
      message: 'Cloud drive settings saved successfully'
    }
  } catch (error) {
    devError('save_cloud_drive_settings_failed', error)
    return { success: false, message: 'save_cloud_drive_settings_failed' }
  }
}) 
