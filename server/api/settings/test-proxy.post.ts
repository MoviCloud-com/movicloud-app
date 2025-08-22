import { devLog, devError } from '../../utils/dev'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { proxyEnabled, httpProxy, httpsProxy, allProxy } = body

    if (!proxyEnabled) {
      return { success: false, message: 'proxy_not_enabled' }
    }

    const proxyToUse = httpProxy || httpsProxy || allProxy
    if (!proxyToUse) {
      return { success: false, message: 'proxy_not_configured' }
    }

    try {
      devLog('proxy_fetch_test', proxyToUse)
      
      if (!proxyToUse.match(/^(http|https|socks5):\/\/[\w\-\.]+:\d+$/)) {
        return { success: false, message: 'invalid_proxy_format' }
      }
      
      const fetchOptions: RequestInit = { method: 'HEAD', headers: { 'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8', 'User-Agent': 'MoviCloud/1.0' } }
      
      if (proxyToUse.startsWith('https://') || proxyToUse.startsWith('http://')) {
        const { HttpsProxyAgent } = await import('https-proxy-agent')
        const agent = new HttpsProxyAgent(proxyToUse)
        // @ts-ignore
        fetchOptions.agent = agent
        devLog('using_proxy', proxyToUse)
      } else if (proxyToUse.startsWith('socks5://')) {
        devLog('socks5_not_supported')
      }
      
      devLog('perform_fetch')
      
      const response = await fetch('https://www.google.com', fetchOptions)
      
      devLog('response_status', response.status, response.statusText)
      
      if (response.ok || response.status === 301 || response.status === 302) {
        devLog('proxy_test_success')
        return { success: true, message: 'proxy_test_success' }
      } else {
        devLog('proxy_connected_target_error')
        return { success: true, message: 'proxy_connected_but_target_error' }
      }
    } catch (fetchError: any) {
      devError('proxy_fetch_failed', fetchError.message)
      
      let messageKey = 'proxy_test_failed'
      if (fetchError.message.includes('Connection refused')) messageKey = 'connection_refused'
      else if (fetchError.message.includes('timeout')) messageKey = 'request_timeout'
      else if (fetchError.message.includes('Could not resolve host')) messageKey = 'could_not_resolve_host'
      else if (fetchError.message.includes('Failed to connect')) messageKey = 'proxy_failed_to_connect'
      
      return { success: false, message: messageKey }
    }
  } catch (error: any) {
    devError('proxy_test_failed', error)
    return { success: false, message: 'proxy_test_failed' }
  }
}) 