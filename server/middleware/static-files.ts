import { createReadStream, statSync } from 'fs'
import { join } from 'path'

export default defineEventHandler(async (event) => {
  const url = getRequestURL(event)
  
  // 只处理 /uploads/ 路径的请求
  if (!url.pathname.startsWith('/uploads/')) {
    return
  }
  
  try {
    // 在生产环境中，文件保存在 data/uploads/ 目录中
    const filePath = process.env.NODE_ENV === 'production'
      ? join(process.cwd(), 'data', url.pathname.substring(1)) // 移除开头的 /
      : join(process.cwd(), 'public', url.pathname.substring(1))
    
    // 检查文件是否存在
    const stats = statSync(filePath)
    if (!stats.isFile()) {
      throw createError({
        statusCode: 404,
        statusMessage: 'File not found'
      })
    }
    
    // 设置响应头
    setHeader(event, 'Content-Type', getContentType(filePath))
    setHeader(event, 'Content-Length', stats.size)
    setHeader(event, 'Cache-Control', 'public, max-age=31536000, immutable')
    
    // 返回文件流
    return createReadStream(filePath)
  } catch (error) {
    // 如果文件不存在或其他错误，返回404
    throw createError({
      statusCode: 404,
      statusMessage: 'File not found'
    })
  }
})

// 根据文件扩展名获取Content-Type
function getContentType(filePath: string): string {
  const ext = filePath.split('.').pop()?.toLowerCase()
  const mimeTypes: Record<string, string> = {
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'webp': 'image/webp',
    'svg': 'image/svg+xml',
    'ico': 'image/x-icon'
  }
  return mimeTypes[ext || ''] || 'application/octet-stream'
} 