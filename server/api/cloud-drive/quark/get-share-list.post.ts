import { QuarkClient } from '../../../utils/quark'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { cookies, pwdID, stoken, pdirFid = '0', page = 1, size = 100 } = body

    if (!cookies || !pwdID || !stoken) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Cookies, pwdID and stoken are required'
      })
    }

    const client = new QuarkClient({ cookies })
    const result = await client.getShareList(pwdID, stoken, pdirFid, page, size)

    return {
      success: true,
      code: 'OK',
      message: 'Get share list success',
      data: result
    }
  } catch (error: any) {
    console.error('Quark get share list error:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.message || 'Failed to get share list'
    })
  }
})
