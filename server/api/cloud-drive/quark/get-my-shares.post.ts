import { QuarkClient } from '~/server/utils/quark'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { cookies, page = 1, size = 50, orderField = 'created_at', orderType = 'desc' } = body
    
    const client = new QuarkClient({ cookies })
    const data = await client.getMyShareList(page, size, orderField, orderType)
    
    return {
      success: true,
      code: 'OK',
      message: '获取分享列表成功',
      data
    }
  } catch (error: any) {
    console.error('[Quark] Get my shares error:', error)
    return {
      success: false,
      code: 'GET_SHARES_ERROR',
      message: error.message || '获取分享列表失败',
      data: undefined
    }
  }
})
