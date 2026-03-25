import { ThunderService } from '../../../utils/thunder'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { refreshToken, captchaUserId, fileId, newName } = body

    if (!refreshToken || !captchaUserId || !fileId || !newName) {
      return { success: false, message: '参数不完整' }
    }

    ThunderService.setConfig({
      refreshToken,
      captchaUserId
    })

    const result = await ThunderService.renameFile(fileId, newName)

    return {
      success: true,
      data: result
    }
  } catch (error) {
    console.error('[Thunder] Rename file error:', error)
    return {
      success: false,
      code: 'RENAME_FILE_ERROR',
      message: (error as Error).message || '重命名文件失败',
      data: undefined
    }
  }
})
