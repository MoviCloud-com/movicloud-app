import { devError } from '../../utils/dev'

export default defineEventHandler(async (event) => {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000)
    
    try {
      const response = await fetch('https://api.tmdb.org/3/configuration?api_key=test', {
        signal: controller.signal,
        headers: { 'User-Agent': 'MoviCloud/1.0', 'Accept': 'application/json' }
      })
      
      clearTimeout(timeoutId)
      
      return { success: true, message: 'tmdb_reachable' }
    } catch (fetchError: any) {
      clearTimeout(timeoutId)
      
      if (fetchError.name === 'AbortError') {
        return { success: false, message: 'request_timeout' }
      }
      
      return { success: false, message: 'tmdb_unreachable' }
    }
  } catch (error) {
    devError('tmdb_test_failed', error)
    return { success: false, message: 'network_test_failed' }
  }
}) 