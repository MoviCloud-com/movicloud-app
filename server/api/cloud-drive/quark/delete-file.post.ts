import { QuarkClient } from '~/server/utils/quark'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { cookies, fidList } = body
    
    const client = new QuarkClient({ cookies })
    const result = await client.deleteFile(fidList)
    
    return result
  } catch (error: any) {
    console.error('[Quark] Delete file error:', error)
    return {
      success: false,
      code: 'DELETE_FILE_ERROR',
      message: error.message || '删除文件失败',
      data: undefined
    }
  }
})
