import { UCClient } from '../../../utils/uc'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { cookies, fidList } = body

    if (!cookies || !fidList || !Array.isArray(fidList)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Cookies and fidList (array) are required'
      })
    }

    const client = new UCClient({ cookies })
    const result = await client.deleteFile(fidList)

    return result
  } catch (error: any) {
    console.error('UC delete file error:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.message || 'Failed to delete file'
    })
  }
})
