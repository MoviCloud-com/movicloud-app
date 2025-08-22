import { dbManager } from '../../database/database'
import { devError } from '../../utils/dev'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { proxyEnabled, httpProxy, httpsProxy, allProxy } = body

    if (proxyEnabled !== undefined) await dbManager.setSetting('proxy_enabled', proxyEnabled ? '1' : '0')
    if (httpProxy !== undefined) await dbManager.setSetting('http_proxy', httpProxy)
    if (httpsProxy !== undefined) await dbManager.setSetting('https_proxy', httpsProxy)
    if (allProxy !== undefined) await dbManager.setSetting('all_proxy', allProxy)

    return { success: true, message: 'proxy_settings_saved' }
  } catch (error: any) {
    devError('proxy_settings_save_failed', error)
    return { success: false, message: 'proxy_settings_save_failed' }
  }
}) 