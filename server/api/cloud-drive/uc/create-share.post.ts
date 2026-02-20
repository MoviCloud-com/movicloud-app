import { UCClient } from '../../../utils/uc'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { cookies, fidList, passcode = '', expiredType = 1, expiredAt = 0 } = body
    
    const client = new UCClient({ cookies })
    const result = await client.createShare(fidList, passcode, expiredType, expiredAt)
    
    return result
  } catch (error: any) {
    console.error('[UC] Create share error:', error)
    return {
      success: false,
      code: 'LIST_FILES_ERROR',
      message: error.message || '创建分享失败',
      data: undefined
    }
  }
})
