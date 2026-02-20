import { UCClient } from '../../../utils/uc'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { cookies, pwdID, passcode = '' } = body

    if (!cookies || !pwdID) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Cookies and pwdID are required'
      })
    }

    const client = new UCClient({ cookies })
    const result = await client.getShareStoken(pwdID, passcode)

    return {
      success: true,
      code: 'OK',
      message: 'Get share stoken success',
      data: result
    }
  } catch (error: any) {
    console.error('UC get share stoken error:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.message || 'Failed to get share stoken'
    })
  }
})
