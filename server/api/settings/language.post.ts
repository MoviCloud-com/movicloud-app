import { configManager } from '../../utils/config-manager'
import { devError } from '../../utils/dev'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { language } = body

    if (!language) {
      return { success: false, message: 'language_param_required' }
    }

    configManager.setSetting('language', language)

    return { success: true, message: 'save_language_success' }
  } catch (error: any) {
    devError('save_language_failed', error)
    return { success: false, message: 'save_language_failed' }
  }
}) 