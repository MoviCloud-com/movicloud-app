import { QuarkClient } from '../../../utils/quark'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { cookies, shareIds } = body
    
    const client = new QuarkClient({ cookies })
    await client.deleteShare(shareIds)
    
    return {
      success: true,
      code: 'OK',
      message: '删除分享成功',
      data: undefined
    }
  } catch (error: any) {
    console.error('[Quark] Delete share error:', error)
    return {
      success: false,
      code: 'DELETE_SHARE_ERROR',
      message: error.message || '删除分享失败',
      data: undefined
    }
  }
})
