import { ThunderService } from '../../../utils/thunder'
import type { CloudFile } from '../../../../composables/useCloudFileManagement'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { refreshToken, captchaUserId, keyword } = body

    if (!refreshToken || !captchaUserId || !keyword) {
      return { success: false, message: '参数不完整' }
    }

    ThunderService.setConfig({
      refreshToken,
      captchaUserId
    })

    const searchResult = await ThunderService.search(keyword)
    
    const cloudFiles: CloudFile[] = (searchResult.items || []).map(file => ({
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
    console.error('[Thunder] Search files error:', error)
    return {
      success: false,
      code: 'SEARCH_ERROR',
      message: (error as Error).message || '搜索文件失败',
      data: undefined
    }
  }
})
