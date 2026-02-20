import { UCClient } from '../../../utils/uc'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { 
      cookies, 
      pwdID, 
      stoken, 
      fidList = [], 
      shareTokenList = [], 
      toPdirFid = '0', 
      pdirSaveAll = true 
    } = body

    if (!cookies || !pwdID || !stoken) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Cookies, pwdID and stoken are required'
      })
    }

    const client = new UCClient({ cookies })
    const result = await client.saveShareFile(pwdID, stoken, fidList, shareTokenList, toPdirFid, pdirSaveAll)

    return {
      success: true,
      code: 'OK',
      message: 'Save share file success',
      data: result
    }
  } catch (error: any) {
    console.error('UC save share file error:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.message || 'Failed to save share file'
    })
  }
})
