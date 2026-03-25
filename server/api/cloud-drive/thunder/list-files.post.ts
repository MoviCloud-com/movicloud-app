import { ThunderService } from '../../../utils/thunder'
import type { CloudFile } from '../../../../composables/useCloudFileManagement'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { refreshToken, captchaUserId, parentId = '' } = body

    if (!refreshToken || !captchaUserId) {
      return { success: false, message: '参数不完整' }
    }

    ThunderService.setConfig({
      refreshToken,
      captchaUserId
    })

    const files = await ThunderService.getFiles(parentId)
    
    const cloudFiles: CloudFile[] = files.map(file => ({
      fid: file.id,
      file_name: file.name,
      path: '',
      size: parseInt(file.size || '0'),
      ctime: new Date(file.created_time || 0).getTime() / 1000,
      mtime: new Date(file.modified_time || 0).getTime() / 1000,
      dir: file.kind === 'drive#folder'
    }))

    return {
      success: true,
      data: {
        list: cloudFiles
      }
    }
  } catch (error) {
    console.error('[Thunder] List files error:', error)
    return {
      success: false,
      code: 'LIST_FILES_ERROR',
      message: (error as Error).message || '获取文件列表失败',
      data: undefined
    }
  }
})
