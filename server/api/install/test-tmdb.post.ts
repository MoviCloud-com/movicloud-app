import { devLog, devError } from '../../utils/dev'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { apiKey, baseUrl: inputBaseUrl, proxyUrl, httpProxy, httpsProxy, allProxy, proxyEnabled } = body

    if (!apiKey) {
      return { success: false, message: 'installation_api_key_required' }
    }

    const baseUrl = inputBaseUrl || 'https://api.tmdb.org'
    const testUrl = `${baseUrl}/3`
    const testEndpoint = `${testUrl}/configuration?api_key=${apiKey}`
    
    try {
      devLog('installation_test_tmdb', testEndpoint)
      devLog('proxy_config', { proxyEnabled, httpProxy, httpsProxy, allProxy })
      
      if (proxyEnabled && (httpProxy || httpsProxy || allProxy)) {
        devLog('use_proxy_for_tmdb_test')
        const { HttpsProxyAgent } = await import('https-proxy-agent')
        
        const proxyToUse = httpProxy || httpsProxy || allProxy
        
        if (!proxyToUse.match(/^(http|https|socks5):\/\/[\w\-\.]+:\d+$/)) {
          return { success: false, message: 'invalid_proxy_format' }
        }
        
        const fetchOptions: RequestInit = { method: 'GET', headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' } }
        
        if (proxyToUse.startsWith('https://') || proxyToUse.startsWith('http://')) {
          const agent = new HttpsProxyAgent(proxyToUse)
          // @ts-ignore
          fetchOptions.agent = agent
        } else if (proxyToUse.startsWith('socks5://')) {
          devLog('socks5_not_supported')
        }
        
        devLog('perform_proxy_fetch')
        
        const response = await fetch(testEndpoint, fetchOptions)
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }
        
        const responseData = await response.json()
        devLog('proxy_fetch_success', responseData)
        
        if (responseData.status_code === 7) {
          return { success: true, message: 'installation_api_test_success_invalid_key', data: { baseUrl: 'https://image.tmdb.org/t/p', secureBaseUrl: 'https://image.tmdb.org/t/p' } }
        } else if (responseData.images && responseData.images.base_url) {
          return { success: true, message: 'installation_api_test_success', data: { baseUrl: responseData.images.base_url, secureBaseUrl: responseData.images.secure_base_url } }
        } else {
          return { success: true, message: 'installation_api_test_success_network_ok', data: { baseUrl: 'https://image.tmdb.org/t/p', secureBaseUrl: 'https://image.tmdb.org/t/p' } }
        }
      } else {
        devLog('direct_tmdb_fetch')
        const response = await fetch(testEndpoint, { method: 'GET', headers: { 'Accept': 'application/json', 'User-Agent': 'MoviCloud/1.0' }, signal: AbortSignal.timeout(15000) })
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }
        
        const data = await response.json()
        devLog('direct_fetch_success', data)
        
        if (data.status_code === 7) {
          return { success: true, message: 'installation_api_test_success_invalid_key', data: { baseUrl: 'https://image.tmdb.org/t/p', secureBaseUrl: 'https://image.tmdb.org/t/p' } }
        } else if (data.images && data.images.base_url) {
          return { success: true, message: 'installation_api_test_success', data: { baseUrl: data.images.base_url, secureBaseUrl: data.images.secure_base_url } }
        } else {
          return { success: true, message: 'installation_api_test_success_network_ok', data: { baseUrl: 'https://image.tmdb.org/t/p', secureBaseUrl: 'https://image.tmdb.org/t/p' } }
        }
      }
    } catch (error: any) {
      devError('installation_tmdb_test_failed', error.message)
      
      let messageKey = 'installation_api_test_failed'
      if (error.message.includes('fetch')) messageKey = 'installation_network_failed'
      else if (error.message.includes('timeout')) messageKey = 'request_timeout'
      else if (error.message.includes('Connection refused')) messageKey = 'connection_refused'
      else if (error.message.includes('Could not resolve host')) messageKey = 'could_not_resolve_host'
      
      return { success: false, message: messageKey }
    }
  } catch (error: any) {
    devError('installation_tmdb_test_failed', error)
    return { success: false, message: 'installation_api_test_failed' }
  }
}) 