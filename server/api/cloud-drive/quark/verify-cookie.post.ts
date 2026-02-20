import { QuarkClient } from '../../../utils/quark'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { cookies } = body

    if (!cookies) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Cookies are required'
      })
    }

    const client = new QuarkClient({ cookies })
    
    const verifyResult = await client.verifyCookie()
    
    if (!verifyResult.success) {
      return {
        success: false,
        message: verifyResult.message || 'Cookie验证失败',
        code: verifyResult.code
      }
    }
    
    const nickname = await client.getUserNickname()
    
    return {
      success: true,
      message: 'Cookie验证成功',
      nickname: nickname || '未命名用户'
    }
  } catch (error: any) {
    console.error('Quark verify cookie error:', error)
    return {
      success: false,
      message: error.message || 'Cookie验证失败',
      code: 'VERIFY_ERROR'
    }
  }
})
