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

    const body = await readBody(event)
    const { email } = body

    if (!email || typeof email !== 'string' || email.trim().length === 0) {
      throw createError({
        statusCode: 400,
        statusMessage: 'email_required'
      })
    }

    // 简单的邮箱格式验证
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email.trim())) {
      throw createError({
        statusCode: 400,
        statusMessage: 'email_invalid_format'
      })
    }

    if (email.trim().length > 100) {
      throw createError({
        statusCode: 400,
        statusMessage: 'email_too_long_100'
      })
    }

    // 更新数据库中的用户邮箱
    const dbManager = new DatabaseManager()
    await dbManager.initialize()
    
    await dbManager.updateUserEmail(userId, email.trim())
    
    return {
      success: true,
      message: 'email_updated',
      email: email.trim()
    }
  } catch (error) {
    throw createError({
      statusCode: 500,
      statusMessage: error instanceof Error ? error.message : 'failed_to_update_email'
    })
  }
}) 