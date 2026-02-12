import { QuarkClient } from '~/server/utils/quark'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { cookies, query, page = 1, pageSize = 50 } = body
    
    const client = new QuarkClient({ cookies })
    const result = await client.searchFiles(query, page, pageSize)
    
    return result
  } catch (error: any) {
    console.error('[Quark] Search files error:', error)
    return {
      success: false,
      code: 'SEARCH_FILES_ERROR',
      message: error.message || '搜索文件失败',
      data: undefined
    }
  }
})
