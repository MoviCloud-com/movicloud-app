import { ThunderService } from '../../../utils/thunder'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { refreshToken, captchaUserId } = body

    if (!refreshToken || !captchaUserId) {
      return { success: false, message: '参数不完整' }
    }

    ThunderService.setConfig({
      refreshToken,
      captchaUserId
    })

    const result = await ThunderService.getUserInfo()

    return {
      success: true,
      data: result
    }
  } catch (error) {
    console.error('[Thunder] Get user info error:', error)
    return {
      success: false,
      code: 'GET_USER_INFO_ERROR',
      message: (error as Error).message || '获取用户信息失败',
      data: undefined
    }
  }
})
