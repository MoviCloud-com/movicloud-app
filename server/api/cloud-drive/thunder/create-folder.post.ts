import { ThunderService } from '../../../utils/thunder'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { refreshToken, captchaUserId, folderName, pdirFid = '' } = body

    if (!refreshToken || !captchaUserId || !folderName) {
      return { success: false, message: '参数不完整' }
    }

    ThunderService.setConfig({
      refreshToken,
      captchaUserId
    })

    const result = await ThunderService.createFolder(pdirFid, folderName)

    return {
      success: true,
      data: result
    }
  } catch (error) {
    console.error('[Thunder] Create folder error:', error)
    return {
      success: false,
      code: 'CREATE_FOLDER_ERROR',
      message: (error as Error).message || '创建文件夹失败',
      data: undefined
    }
  }
})
