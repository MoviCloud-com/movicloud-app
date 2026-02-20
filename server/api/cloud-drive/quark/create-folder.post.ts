import { QuarkClient } from '../../../utils/quark'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { cookies, folderName, pdirFid = '0' } = body

    if (!cookies || !folderName) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Cookies and folderName are required'
      })
    }

    const client = new QuarkClient({ cookies })
    const result = await client.createFolder(folderName, pdirFid)

    return result
  } catch (error: any) {
    console.error('Quark create folder error:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.message || 'Failed to create folder'
    })
  }
})
