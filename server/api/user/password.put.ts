import { hash, compare } from 'bcrypt'
import jwt from 'jsonwebtoken'

export default defineEventHandler(async (event) => {
  try {
    // 从请求头获取认证token
    const authHeader = getHeader(event, 'authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw createError({
        statusCode: 401,
        statusMessage: 'unauthorized'
      })
    }

    const token = authHeader.substring(7)

    const body = await readBody(event)
    const { currentPassword, newPassword } = body

    if (!currentPassword || !newPassword) {
      throw createError({
        statusCode: 400,
        statusMessage: 'all_fields_required'
      })
    }

    if (newPassword.length < 6) {
      throw createError({
        statusCode: 400,
        statusMessage: 'new_password_too_short_6'
      })
    }

    if (newPassword.length > 50) {
      throw createError({
        statusCode: 400,
        statusMessage: 'new_password_too_long_50'
      })
    }

    // 验证JWT token并获取用户ID
    let userId: string
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'movicloud-secret-key') as any
      userId = decoded.userId
    } catch (error) {
      throw createError({
        statusCode: 401,
        statusMessage: 'invalid_token'
      })
    }
    
    // 从数据库验证当前密码
    const { DatabaseManager } = await import('../../database/database')
    const dbManager = new DatabaseManager()
    await dbManager.initialize()
    
    const isCurrentPasswordValid = await dbManager.verifyUserPassword(userId, currentPassword)
    if (!isCurrentPasswordValid) {
      throw createError({
        statusCode: 400,
        statusMessage: 'current_password_incorrect'
      })
    }

    // 更新数据库中的密码哈希
    await dbManager.updateUserPassword(userId, newPassword)
    
    return {
      success: true,
      message: 'password_updated'
    }
  } catch (error) {
    throw createError({
      statusCode: 500,
      statusMessage: error instanceof Error ? error.message : 'password_update_failed'
    })
  }
}) 