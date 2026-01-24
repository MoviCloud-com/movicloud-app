import { devLog, devError } from '../../utils/dev'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { apiKey, baseUrl: inputBaseUrl } = body

    if (!apiKey) {
      return { success: false, message: 'installation_api_key_required' }
    }

    const baseUrl = inputBaseUrl || 'https://api.tmdb.org'
    const testUrl = `${baseUrl}/3`
    const testEndpoint = `${testUrl}/configuration?api_key=${apiKey}`
    
    try {
      devLog('installation_test_tmdb', testEndpoint)

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