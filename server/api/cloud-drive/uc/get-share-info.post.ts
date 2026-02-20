import { UCClient } from '../../../utils/uc'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { text } = body

    if (!text) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Text is required'
      })
    }

    const client = new UCClient({ cookies: '' })
    const result = client.getShareInfo(text)

    return {
      success: true,
      code: 'OK',
      message: 'Get share info success',
      data: result
    }
  } catch (error: any) {
    console.error('UC get share info error:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.message || 'Failed to get share info'
    })
  }
})
