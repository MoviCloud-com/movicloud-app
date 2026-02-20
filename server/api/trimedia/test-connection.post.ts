import { testConnection } from '../../utils/trimedia'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { host, username, password } = body
    
    if (!host || !username || !password) {
      return { success: false, message: 'missing_required_fields' }
    }
    
    const result = await testConnection(host, username, password)
    return result
  } catch (error) {
    return { success: false, message: 'test_connection_failed' }
  }
})
