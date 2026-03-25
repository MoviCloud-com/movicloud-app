import { ThunderService } from '../../../utils/thunder'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { refreshToken, captchaUserId, fileIds } = body

    if (!refreshToken || !captchaUserId || !fileIds || fileIds.length === 0) {
      return { success: false, message: '参数不完整' }
    }

    ThunderService.setConfig({
      refreshToken,
      captchaUserId
    })

    const result = await ThunderService.createShare(fileIds[0])

    if ('error' in result) {
      return { success: false, message: result.error }
    }

    return {
      success: true,
      data: {
        share_url: result.share_url + '?pwd=' + result.pass_code,
        pass_code: result.pass_code,
        share_text: result.share_text
      }
    }
  } catch (error) {
    console.error('[Thunder] Create share error:', error)
    return {
      success: false,
      code: 'CREATE_SHARE_ERROR',
      message: (error as Error).message || '创建分享失败',
      data: undefined
    }
  }
})
