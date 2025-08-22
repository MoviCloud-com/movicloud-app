import { DatabaseManager } from '../../database/database'
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

    const body = await readBody(event)
    const { username } = body

    if (!username || typeof username !== 'string' || username.trim().length === 0) {
      throw createError({
        statusCode: 400,
        statusMessage: 'username_required'
      })
    }

    if (username.trim().length < 3) {
      throw createError({
        statusCode: 400,
        statusMessage: 'username_too_short_3'
      })
    }

    if (username.trim().length > 50) {
      throw createError({
        statusCode: 400,
        statusMessage: 'username_too_long_50'
      })
    }

    // 检查用户名是否已存在
    const dbManager = new DatabaseManager()
    await dbManager.initialize()
    
    const existingUser = await dbManager.getUser(username.trim())
    if (existingUser && existingUser.id !== userId) {
      throw createError({
        statusCode: 400,
        statusMessage: 'username_exists'
      })
    }

    // 更新数据库中的用户名
    await dbManager.updateUserUsername(userId, username.trim())
    
    return {
      success: true,
      message: 'username_updated',
      username: username.trim()
    }
  } catch (error) {
    throw createError({
      statusCode: 500,
      statusMessage: error instanceof Error ? error.message : 'failed_to_update_username'
    })
  }
}) 