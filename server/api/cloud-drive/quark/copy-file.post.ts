import { QuarkClient } from '~/server/utils/quark'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { cookies, srcFid, destFid } = body
    
    const client = new QuarkClient({ cookies })
    const result = await client.copyFile(srcFid, destFid)
    
    return result
  } catch (error: any) {
    console.error('[Quark] Copy file error:', error)
    return {
      success: false,
      code: 'COPY_FILE_ERROR',
      message: error.message || '复制文件失败',
      data: undefined
    }
  }
})
