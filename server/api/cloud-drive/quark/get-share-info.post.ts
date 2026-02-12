import { QuarkClient } from '~/server/utils/quark'

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

    const client = new QuarkClient({ cookies: '' })
    const result = client.getShareInfo(text)

    return {
      success: true,
      code: 'OK',
      message: 'Get share info success',
      data: result
    }
  } catch (error: any) {
    console.error('Quark get share info error:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.message || 'Failed to get share info'
    })
  }
})
