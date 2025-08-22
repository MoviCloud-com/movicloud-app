import { devError } from '../../utils/dev'

export default defineEventHandler(async (event) => {
  try {
    // 清除cookie中的token
    setCookie(event, 'token', '', { 
      maxAge: 0,
      path: '/',
      httpOnly: true
    })

    return { success: true, message: 'logout_success' }
  } catch (error) {
    devError('logout_failed', error)
    return { success: false, message: 'logout_failed' }
  }
}) 