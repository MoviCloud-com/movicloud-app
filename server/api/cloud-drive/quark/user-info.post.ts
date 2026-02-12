import { QuarkClient } from '~/server/utils/quark'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { cookies } = body

    if (!cookies) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Cookies are required'
      })
    }

    const client = new QuarkClient({ cookies })
    const result = await client.getUserInfo()

    return result
  } catch (error: any) {
    console.error('Quark user info error:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.message || 'Failed to get user info'
    })
  }
})
