import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
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

    const formData = await readMultipartFormData(event)
    if (!formData) {
      throw createError({
        statusCode: 400,
        statusMessage: 'no_file_uploaded'
      })
    }

    const avatarFile = formData.find(item => item.name === 'avatar')
    if (!avatarFile || !avatarFile.filename) {
      throw createError({
        statusCode: 400,
        statusMessage: 'please_select_avatar'
      })
    }

    // 检查文件类型
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif']
    if (!allowedTypes.includes(avatarFile.type || '')) {
      throw createError({
        statusCode: 400,
        statusMessage: 'invalid_image_format'
      })
    }

    // 检查文件大小 (2MB)
    if (avatarFile.data.length > 2 * 1024 * 1024) {
      throw createError({
        statusCode: 400,
        statusMessage: 'file_too_large_2mb'
      })
    }

    // 创建上传目录 - 在Docker环境中使用持久化目录
    const uploadDir = process.env.NODE_ENV === 'production' 
      ? join(process.cwd(), 'data', 'uploads', 'avatars')
      : join(process.cwd(), 'public', 'uploads', 'avatars')
    await mkdir(uploadDir, { recursive: true })

    // 生成文件名
    const timestamp = Date.now()
    const extension = avatarFile.filename.split('.').pop()
    const filename = `avatar_${timestamp}.${extension}`
    const filepath = join(uploadDir, filename)

    // 保存文件
    await writeFile(filepath, avatarFile.data)

    // 返回文件URL - 在生产环境中，文件保存在data目录但通过uploads路径访问
    const avatarUrl = `/uploads/avatars/${filename}`

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
    
    // 更新数据库中的用户头像
    const { DatabaseManager } = await import('../../database/database')
    const dbManager = new DatabaseManager()
    await dbManager.initialize()
    
    await dbManager.updateUserAvatar(userId, avatarUrl)

    return {
      avatar: avatarUrl,
      message: 'avatar_updated'
    }
  } catch (error) {
    throw createError({
      statusCode: 500,
      statusMessage: error instanceof Error ? error.message : 'failed_to_update_avatar'
    })
  }
}) 