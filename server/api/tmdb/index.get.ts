import { configManager } from '../../utils/config-manager'
import { devLog, devError } from '../../utils/dev'
import { createFetchOptions } from '../../utils/http'

// 从配置文件加载TMDB配置
const loadTMDBConfig = () => {
  try {
    const apiKey = configManager.getSetting('tmdb_api_key')
    const apiBaseUrl = configManager.getSetting('tmdb_api_base_url') || 'https://api.tmdb.org'
    const imageBaseUrl = configManager.getSetting('tmdb_image_base_url') || 'https://image.tmdb.org/t/p'
    
    return {
      apiKey,
      apiBaseUrl,
      imageBaseUrl
    }
  } catch (error) {
    devError('加载TMDB配置失败:', error)
    throw error
  }
}

// 从配置文件加载语言设置
const loadLanguageConfig = () => {
  try {
    const language = configManager.getSetting('language') || 'zh-CN'
    return language
  } catch (error) {
    devError('加载语言配置失败:', error)
    return 'zh-CN'
  }
}

// 使用fetch进行TMDB请求（直连/环境代理）
const makeTMDBRequest = async (endpoint: string) => {
  try {
    const apiKey = configManager.getSetting('tmdb_api_key')
    const baseUrl = configManager.getSetting('tmdb_api_base_url') || 'https://api.tmdb.org'
    const language = loadLanguageConfig()
    
    if (!apiKey) {
      throw new Error('TMDB API密钥未配置')
    }
    
    const rawUrl = `${baseUrl.replace(/\/$/, '')}/3${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`
    const urlObj = new URL(rawUrl)
    urlObj.searchParams.set('api_key', apiKey)
    urlObj.searchParams.set('language', language)
    const url = urlObj.toString()
    
    devLog('TMDB请求URL:', url)
    
    const baseOptions = createFetchOptions()
    const response = await fetch(url, {
      method: 'GET',
      headers: baseOptions.headers,
      // @ts-ignore
      agent: baseOptions.agent,
      signal: baseOptions.signal
    })
    
    if (!response.ok) {
      devError('tmdb_http_error', { status: response.status, statusText: response.statusText })
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }
    
    const result = await response.json()
    return result
  } catch (error) {
    // @ts-ignore
    const cause = error?.cause ? { cause: String(error.cause) } : undefined
    devError('tmdb_request_failed', { message: String(error), ...cause })
    throw error
  }
}

export default defineEventHandler(async (event) => {
  try {
    const queryParams = getQuery(event)
    const action = queryParams.action as string
    const page = parseInt(queryParams.page as string) || 1
    const id = parseInt(queryParams.id as string)
    const searchQuery = queryParams.query as string
    
    if (!action) {
      throw createError({ statusCode: 400, statusMessage: 'missing_action_param' })
    }
    
    let result: any
    
    switch (action) {
      case 'popular-movies':
        result = await makeTMDBRequest(`/movie/popular?page=${page}`)
        break
        
      case 'top-rated-movies':
        result = await makeTMDBRequest(`/movie/top_rated?page=${page}`)
        break
        
      case 'popular-tv':
        result = await makeTMDBRequest(`/tv/popular?page=${page}`)
        break
        
      case 'top-rated-tv':
        result = await makeTMDBRequest(`/tv/top_rated?page=${page}`)
        break
        
      case 'trending':
        result = await makeTMDBRequest(`/trending/all/day`)
        break
        
      case 'movie-details':
        if (!id) throw createError({ statusCode: 400, statusMessage: 'missing_movie_id' })
        result = await makeTMDBRequest(`/movie/${id}?append_to_response=credits,videos,images,similar,recommendations`)
        break
        
      case 'tv-details':
        if (!id) throw createError({ statusCode: 400, statusMessage: 'missing_tv_id' })
        result = await makeTMDBRequest(`/tv/${id}?append_to_response=credits,videos,images,similar,recommendations`)
        break
        
      case 'movie-images':
        if (!id) throw createError({ statusCode: 400, statusMessage: 'missing_movie_id' })
        result = await makeTMDBRequest(`/movie/${id}/images?include_image_language=zh,en,null`)
        break
        
      case 'tv-images':
        if (!id) throw createError({ statusCode: 400, statusMessage: 'missing_tv_id' })
        result = await makeTMDBRequest(`/tv/${id}/images?include_image_language=zh,en,null`)
        break
        
      case 'search':
        if (!searchQuery) throw createError({ statusCode: 400, statusMessage: 'missing_search_query' })
        result = await makeTMDBRequest(`/search/multi?query=${encodeURIComponent(searchQuery)}`)
        break
        
      case 'person-details':
        if (!id) throw createError({ statusCode: 400, statusMessage: 'missing_person_id' })
        result = await makeTMDBRequest(`/person/${id}?append_to_response=combined_credits`)
        break
        
      case 'person-movie-credits':
        if (!id) throw createError({ statusCode: 400, statusMessage: 'missing_person_id' })
        result = await makeTMDBRequest(`/person/${id}/movie_credits`)
        break
        
      case 'person-tv-credits':
        if (!id) throw createError({ statusCode: 400, statusMessage: 'missing_person_id' })
        result = await makeTMDBRequest(`/person/${id}/tv_credits`)
        break
        
      case 'movie-genres':
        result = await makeTMDBRequest(`/genre/movie/list`)
        break
        
      case 'tv-genres':
        result = await makeTMDBRequest(`/genre/tv/list`)
        break
        
      case 'movie-recommendations':
        if (!id) throw createError({ statusCode: 400, statusMessage: 'missing_movie_id' })
        result = await makeTMDBRequest(`/movie/${id}/recommendations?page=${page}`)
        break
        
      case 'tv-recommendations':
        if (!id) throw createError({ statusCode: 400, statusMessage: 'missing_tv_id' })
        result = await makeTMDBRequest(`/tv/${id}/recommendations?page=${page}`)
        break
        
      case 'similar-movies':
        if (!id) throw createError({ statusCode: 400, statusMessage: 'missing_movie_id' })
        result = await makeTMDBRequest(`/movie/${id}/similar?page=${page}`)
        break
        
      case 'similar-tv':
        if (!id) throw createError({ statusCode: 400, statusMessage: 'missing_tv_id' })
        result = await makeTMDBRequest(`/tv/${id}/similar?page=${page}`)
        break
        
      case 'discover-movies':
        const movieParams = new URLSearchParams({
          page: page.toString()
        })
        if (queryParams.sort) movieParams.append('sort_by', queryParams.sort as string)
        if (queryParams.genres) movieParams.append('with_genres', queryParams.genres as string)
        if (queryParams.languages) movieParams.append('with_original_language', queryParams.languages as string)
        if (queryParams.minRating) movieParams.append('vote_average.gte', queryParams.minRating as string)
        result = await makeTMDBRequest(`/discover/movie?${movieParams}`)
        break
        
      case 'discover-tv':
        const tvParams = new URLSearchParams({
          page: page.toString()
        })
        if (queryParams.sort) tvParams.append('sort_by', queryParams.sort as string)
        if (queryParams.genres) tvParams.append('with_genres', queryParams.genres as string)
        if (queryParams.languages) tvParams.append('with_original_language', queryParams.languages as string)
        if (queryParams.minRating) tvParams.append('vote_average.gte', queryParams.minRating as string)
        result = await makeTMDBRequest(`/discover/tv?${tvParams}`)
        break
        
      default:
        if (action.startsWith('-')) {
          const rawPath = action.slice(1)
          result = await makeTMDBRequest(`/${rawPath}`)
          break
        }
        throw createError({
          statusCode: 400,
          statusMessage: `未知的action: ${action}`
        })
    }
    
    return {
      success: true,
      data: result
    }
    
  } catch (error: any) {
    const { devWarn } = await import('../../utils/dev')
    devWarn('tmdb_request_failed', error)
    return {
      success: false,
      message: 'request_failed',
      error: error.message
    }
  }
}) 