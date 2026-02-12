import { QuarkClient } from '~/server/utils/quark'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { cookies, srcFid, destFid } = body
    
    const client = new QuarkClient({ cookies })
    const result = await client.moveFile(srcFid, destFid)
    
    return result
  } catch (error: any) {
    console.error('[Quark] Move file error:', error)
    return {
      success: false,
      code: 'MOVE_FILE_ERROR',
      message: error.message || '移动文件失败',
      data: undefined
    }
  }
})
