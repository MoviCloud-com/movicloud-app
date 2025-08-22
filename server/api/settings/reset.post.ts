import { dbManager } from '../../database/database'
import { devLog, devError } from '../../utils/dev'

export default defineEventHandler(async (event) => {
  try {
    const user = event.context.user
    if (!user || user.role !== 'admin') {
      throw createError({ statusCode: 403, statusMessage: 'forbidden_admin_only' })
    }

    devLog('factory_reset_start')
    
    await dbManager.resetDatabase()
    
    devLog('factory_reset_done')
    
    return { success: true, message: 'factory_reset_success' }
  } catch (error) {
    devError('factory_reset_failed', error)
    throw createError({ statusCode: 500, statusMessage: 'factory_reset_failed' })
  }
}) 