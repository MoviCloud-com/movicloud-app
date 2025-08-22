import { dbManager } from '../../database/database'
import jwt from 'jsonwebtoken'
import { devError } from '../../utils/dev'

const JWT_SECRET = process.env.JWT_SECRET || 'movicloud-secret-key'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { username, password } = body

    if (!username || !password) {
      return { success: false, message: 'all_fields_required' }
    }

    const isValid = await dbManager.verifyUser(username, password)
    if (!isValid) {
      return { success: false, message: 'invalid_credentials' }
    }

    const user = await dbManager.getUser(username)
    if (!user) {
      return { success: false, message: 'account_not_found' }
    }

    const token = jwt.sign(
      { userId: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    )

    return {
      success: true,
      message: 'login_success',
      data: {
        user: {
          id: user.id,
          username: user.username,
          nickname: user.nickname,
          role: user.role,
          email: user.email,
          avatar: user.avatar
        },
        token
      }
    }
  } catch (error) {
    devError('login_failed', error)
    return { success: false, message: 'login_failed' }
  }
}) 