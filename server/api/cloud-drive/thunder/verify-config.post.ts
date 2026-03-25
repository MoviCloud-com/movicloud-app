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

    await ThunderService.getAccessToken()
    await ThunderService.getCaptchaToken()

    return {
      success: true,
      message: '配置验证成功'
    }
  } catch (error) {
    console.error('[Thunder] Verify config error:', error)
    return {
      success: false,
      code: 'VERIFY_CONFIG_ERROR',
      message: (error as Error).message || '配置验证失败',
      data: undefined
    }
  }
})
