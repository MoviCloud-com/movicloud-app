import { ThunderService } from '../../../utils/thunder'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { refreshToken, captchaUserId, taskId } = body

    if (!refreshToken || !captchaUserId || !taskId) {
      return { success: false, message: '参数不完整' }
    }

    ThunderService.setConfig({
      refreshToken,
      captchaUserId
    })

    const result = await ThunderService.getTaskStatus(taskId)

    return {
      success: true,
      data: result
    }
  } catch (error) {
    console.error('[Thunder] Get task status error:', error)
    return {
      success: false,
      code: 'GET_TASK_STATUS_ERROR',
      message: (error as Error).message || '获取任务状态失败',
      data: undefined
    }
  }
})
