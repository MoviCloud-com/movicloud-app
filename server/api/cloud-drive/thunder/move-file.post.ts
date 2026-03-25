import { ThunderService } from '../../../utils/thunder'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { refreshToken, captchaUserId, fileIds, parentId } = body

    if (!refreshToken || !captchaUserId || !fileIds || !parentId) {
      return { success: false, message: '参数不完整' }
    }

    ThunderService.setConfig({
      refreshToken,
      captchaUserId
    })

    const result = await ThunderService.moveFiles(fileIds, parentId)

    return {
      success: true,
      data: result
    }
  } catch (error) {
    console.error('[Thunder] Move file error:', error)
    return {
      success: false,
      code: 'MOVE_FILE_ERROR',
      message: (error as Error).message || '移动文件失败',
      data: undefined
    }
  }
})
