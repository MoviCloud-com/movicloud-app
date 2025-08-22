import { devLog, devError } from '../utils/dev'

export default defineEventHandler(async (event) => {
  try {
    devLog('proxy_test_start')
    
    let ipResult = null
    try {
      devLog('test_ip')
      const ipResponse = await fetch('https://httpbin.org/ip')
      ipResult = await ipResponse.json()
      devLog('ip_test_ok', ipResult.origin)
    } catch (error: any) {
      devLog('ip_test_failed', error)
    }
    
    let googleResult = null
    try {
      devLog('test_google')
      const googleResponse = await fetch('https://www.google.com', { method: 'HEAD' })
      googleResult = { status: googleResponse.status, ok: googleResponse.ok }
      devLog('google_test_ok', googleResult)
    } catch (error: any) {
      devLog('google_test_failed', error)
      googleResult = { error: error.message }
    }
    
    let tmdbResult = null
    try {
      devLog('test_tmdb')
      const tmdbResponse = await fetch('https://api.tmdb.org/3/configuration?api_key=test')
      tmdbResult = { status: tmdbResponse.status, ok: tmdbResponse.ok }
      devLog('tmdb_test_ok', tmdbResult)
    } catch (error: any) {
      devLog('tmdb_test_failed', error)
      tmdbResult = { error: error.message }
    }
    
    const proxyInfo = {
      HTTP_PROXY: process.env.HTTP_PROXY,
      HTTPS_PROXY: process.env.HTTPS_PROXY,
      ALL_PROXY: process.env.ALL_PROXY
    }
    
    return { success: true, proxyInfo, tests: { ip: ipResult, google: googleResult, tmdb: tmdbResult } }
  } catch (error: any) {
    devError('proxy_test_failed', error)
    return { success: false, message: 'proxy_test_failed' }
  }
}) 