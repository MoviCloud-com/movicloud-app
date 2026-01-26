import { configManager } from '../../utils/config-manager'
import { devError } from '../../utils/dev'

export default defineEventHandler(async (event) => {
  try {
    const language = configManager.getSetting('language') || 'zh-CN'
    
    return { success: true, data: { language } }
  } catch (error: any) {
    devError('get_language_failed', error)
    return { success: false, message: 'get_language_failed' }
  }
}) 