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

    const body = await readBody(event)
    const { nickname } = body

    if (!nickname || typeof nickname !== 'string' || nickname.trim().length === 0) {
      throw createError({
        statusCode: 400,
        statusMessage: 'nickname_required'
      })
    }

    if (nickname.trim().length > 20) {
      throw createError({
        statusCode: 400,
        statusMessage: 'nickname_too_long_20'
      })
    }

    // 验证JWT token并获取用户ID
    let userId: string
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'movicloud-secret-key') as any
      userId = decoded.userId
    } catch (jwtError) {
      throw createError({
        statusCode: 401,
        statusMessage: 'invalid_token'
      })
    }
    
    // 更新数据库中的用户昵称
    const dbManager = new DatabaseManager()
    await dbManager.initialize()
    
    await dbManager.updateUserNickname(userId, nickname.trim())
    
    return {
      success: true,
      message: 'nickname_updated',
      nickname: nickname.trim()
    }
  } catch (error) {
    throw createError({
      statusCode: 500,
      statusMessage: error instanceof Error ? error.message : 'failed_to_update_nickname'
    })
  }
}) 