import { checkMediaExists } from '../../utils/trimedia'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { title, year, tmdbId, mediaType } = body
    
    if (!title || !mediaType) {
      return { 
        success: false, 
        message: 'missing_required_fields',
        data: { exists: false, itemGuid: null, type: null, playUrl: null }
      }
    }
    
    const result = await checkMediaExists(title, year || null, tmdbId || null, mediaType)
    
    return {
      success: true,
      data: result
    }
  } catch (error) {
    return { 
      success: false, 
      message: 'check_media_failed',
      data: { exists: false, itemGuid: null, type: null, playUrl: null }
    }
  }
})
