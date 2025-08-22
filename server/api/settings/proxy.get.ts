import { dbManager } from '../../database/database'
import { devError } from '../../utils/dev'

export default defineEventHandler(async (event) => {
  try {
    const proxyEnabled = await dbManager.getSetting('proxy_enabled')
    const httpProxy = await dbManager.getSetting('http_proxy')
    const httpsProxy = await dbManager.getSetting('https_proxy')
    const allProxy = await dbManager.getSetting('all_proxy')

    return {
      success: true,
      data: { proxyEnabled: proxyEnabled === '1', httpProxy, httpsProxy, allProxy }
    }
  } catch (error: any) {
    devError('get_proxy_settings_failed', error)
    return { success: false, message: 'get_proxy_settings_failed' }
  }
}) 