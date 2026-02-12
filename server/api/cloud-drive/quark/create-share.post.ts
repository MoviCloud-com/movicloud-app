import { QuarkClient } from '../../../utils/quark'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { cookies, fidList, passcode = '', expiredType = 1, expiredAt = 0 } = body

    if (!cookies || !fidList || !Array.isArray(fidList) || fidList.length === 0) {
      return { success: false, message: '参数不完整' }
    }

    const client = new QuarkClient({ cookies })
    const result = await client.createShare(fidList, passcode, expiredType, expiredAt)

    return result
  } catch (error) {
    console.error('创建分享失败:', error)
    return { success: false, message: '创建分享失败' }
  }
})
