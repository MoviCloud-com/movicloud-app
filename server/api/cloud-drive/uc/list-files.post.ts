import { UCClient } from '~/server/utils/uc'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { cookies, dirFid } = body
    
    const client = new UCClient({ cookies })
    const result = await client.listFiles(dirFid)
    
    return result
  } catch (error: any) {
    console.error('[UC] List files error:', error)
    return {
      success: false,
      code: 'LIST_FILES_ERROR',
      message: error.message || '列出文件失败',
      data: undefined
    }
  }
})
