import { QuarkClient } from '../../../utils/quark'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { cookies, fid, newName } = body
    
    const client = new QuarkClient({ cookies })
    const result = await client.renameFile(fid, newName)
    
    return result
  } catch (error: any) {
    console.error('[Quark] Rename file error:', error)
    return {
      success: false,
      code: 'RENAME_FILE_ERROR',
      message: error.message || '重命名文件失败',
      data: undefined
    }
  }
})
