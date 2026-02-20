import { configManager } from '../../utils/config-manager'
import { devError } from '../../utils/dev'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { host, username, password, enabled } = body

    if (host !== undefined) configManager.setSetting('trimedia_host', host)
    if (username !== undefined) configManager.setSetting('trimedia_username', username)
    if (password !== undefined) configManager.setSetting('trimedia_password', password)
    if (enabled !== undefined) configManager.setSetting('trimedia_enabled', enabled ? 'true' : 'false')

    return { success: true, message: 'trimedia_settings_saved' }
  } catch (error: any) {
    devError('trimedia_settings_save_failed', error)
    return { success: false, message: 'trimedia_settings_save_failed' }
  }
})
