import { UCClient } from '../../../utils/uc'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { cookies, srcFid, destFid } = body

    if (!cookies || !srcFid || !destFid) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Cookies, srcFid and destFid are required'
      })
    }

    const client = new UCClient({ cookies })
    const result = await client.moveFile(srcFid, destFid)

    return result
  } catch (error: any) {
    console.error('UC move file error:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.message || 'Failed to move file'
    })
  }
})
