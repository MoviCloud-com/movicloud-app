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
    } catch (jwtError) {
      throw createError({
        statusCode: 401,
        statusMessage: 'invalid_token'
      })
    }
    
    // 从数据库获取用户信息
    const dbManager = new DatabaseManager()
    await dbManager.initialize()
    
    const user = await dbManager.getUserById(userId)
    if (!user) {
      throw createError({
        statusCode: 404,
        statusMessage: 'user_not_found'
      })
    }

    return {
      id: user.id,
      username: user.username,
      nickname: user.nickname,
      avatar: user.avatar || '',
      email: user.email || ''
    }
  } catch (error) {
    throw createError({
      statusCode: 500,
      statusMessage: 'get_user_profile_failed'
    })
  }
}) 