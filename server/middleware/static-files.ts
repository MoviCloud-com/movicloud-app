import { createReadStream, statSync } from 'fs'
import { join } from 'path'
import { getDataDir } from '../utils/data-dir'

export default defineEventHandler(async (event) => {
  const url = getRequestURL(event)
  
  if (!url.pathname.startsWith('/uploads/')) {
    return
  }
  
  try {
    const dataDir = getDataDir()
    const filePath = join(dataDir, url.pathname.substring(1))
    
    const stats = statSync(filePath)
    if (!stats.isFile()) {
      throw createError({
        statusCode: 404,
        statusMessage: 'File not found'
      })
    }
    
    setHeader(event, 'Content-Type', getContentType(filePath))
    setHeader(event, 'Content-Length', stats.size)
    setHeader(event, 'Cache-Control', 'public, max-age=31536000, immutable')
    
    return createReadStream(filePath)
  } catch (error) {
    throw createError({
      statusCode: 404,
      statusMessage: 'File not found'
    })
  }
})

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
