import { devLog, devError } from '../../utils/dev'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { proxyUrl } = body

    if (!proxyUrl) {
      return { success: false, message: 'proxy_url_required' }
    }

    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000)
    
    try {
      const testUrl = 'https://api.tmdb.org/3/configuration?api_key=test'
      const fetchOptions: RequestInit = { signal: controller.signal, headers: { 'User-Agent': 'MoviCloud/1.0', 'Accept': 'application/json' } }

      devLog('proxy_test_start', proxyUrl)
      const response = await fetch(testUrl, fetchOptions)
      
      clearTimeout(timeoutId)
      
      return { success: true, message: 'proxy_test_success' }
    } catch (fetchError: any) {
      clearTimeout(timeoutId)
      devError('proxy_test_failed', fetchError)
      return { success: false, message: 'proxy_test_failed' }
    }
  } catch (error) {
    devError('proxy_test_failed', error)
    return { success: false, message: 'proxy_test_failed' }
  }
}) 