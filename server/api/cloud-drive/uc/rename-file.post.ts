import { UCClient } from '../../../utils/uc'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { cookies, fid, newName } = body

    if (!cookies || !fid || !newName) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Cookies, fid and newName are required'
      })
    }

    const client = new UCClient({ cookies })
    const result = await client.renameFile(fid, newName)

    return result
  } catch (error: any) {
    console.error('UC rename file error:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.message || 'Failed to rename file'
    })
  }
})
