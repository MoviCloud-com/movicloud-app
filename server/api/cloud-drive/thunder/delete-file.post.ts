import { ThunderService } from '../../../utils/thunder'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { refreshToken, captchaUserId, fileId } = body

    if (!refreshToken || !captchaUserId || !fileId) {
      return { success: false, message: '参数不完整' }
    }

    ThunderService.setConfig({
      refreshToken,
      captchaUserId
    })

    const result = await ThunderService.deleteFile(fileId)

    return {
      success: true,
      data: result
    }
  } catch (error) {
    console.error('[Thunder] Delete file error:', error)
    return {
      success: false,
      code: 'DELETE_FILE_ERROR',
      message: (error as Error).message || '删除文件失败',
      data: undefined
    }
  }
})
