import { lookup } from 'dns'
import { promisify } from 'util'
import { devLog, devError } from '../../utils/dev'

const dnsLookup = promisify(lookup)

export default defineEventHandler(async (event) => {
  try {
    devLog('dns_test_start')
    
    const result = await dnsLookup('api.tmdb.org')
    devLog('dns_result', result)
    
    return {
      success: true,
      message: 'dns_ok',
      data: { address: result.address, family: result.family }
    }
  } catch (error) {
    devError('dns_test_failed', error)
    
    try {
      devLog('dns_try_other')
      await dnsLookup('google.com')
      return { success: false, message: 'tmdb_dns_failed_but_others_ok' }
    } catch (otherError) {
      return { success: false, message: 'dns_failed' }
    }
  }
}) 