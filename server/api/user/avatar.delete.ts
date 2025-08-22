import jwt from 'jsonwebtoken'

export default defineEventHandler(async (event) => {
  try {
    const authHeader = getHeader(event, 'authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw createError({ statusCode: 401, statusMessage: 'unauthorized' })
    }

    const token = authHeader.substring(7)

    let userId: string
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'movicloud-secret-key') as any
      userId = decoded.userId
    } catch (error) {
      throw createError({ statusCode: 401, statusMessage: 'invalid_token' })
    }

    const { DatabaseManager } = await import('../../database/database')
    const dbManager = new DatabaseManager()
    await dbManager.initialize()

    // 将头像清空（使用空字符串表示无头像）
    await dbManager.updateUserAvatar(userId, '')

    return {
      avatar: '',
      message: 'avatar_cleared'
    }
  } catch (error) {
    throw createError({
      statusCode: 500,
      statusMessage: error instanceof Error ? error.message : 'clear_avatar_failed'
    })
  }
}) 