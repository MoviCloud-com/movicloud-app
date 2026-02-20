import { writeFile } from 'fs/promises'
import { join } from 'path'
import jwt from 'jsonwebtoken'
import { getUploadsDir } from '../../utils/data-dir'

export default defineEventHandler(async (event) => {
  try {
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

    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif']
    if (!allowedTypes.includes(avatarFile.type || '')) {
      throw createError({
        statusCode: 400,
        statusMessage: 'invalid_image_format'
      })
    }

    if (avatarFile.data.length > 2 * 1024 * 1024) {
      throw createError({
        statusCode: 400,
        statusMessage: 'file_too_large_2mb'
      })
    }

    const uploadDir = getUploadsDir('avatars')

    const timestamp = Date.now()
    const extension = avatarFile.filename.split('.').pop()
    const filename = `avatar_${timestamp}.${extension}`
    const filepath = join(uploadDir, filename)

    await writeFile(filepath, avatarFile.data)

    const avatarUrl = `/uploads/avatars/${filename}`

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
    
    const { configManager } = await import('../../utils/config-manager')
    
    configManager.updateUserAvatar(userId, avatarUrl)

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
