import { dbManager } from '../../database/database'
import { devLog, devError } from '../../utils/dev'
import { HttpsProxyAgent } from 'https-proxy-agent'

// 从数据库加载TMDB配置
const loadTMDBConfig = async () => {
  try {
    const apiKey = await dbManager.getSetting('tmdb_api_key')
    const apiBaseUrl = await dbManager.getSetting('tmdb_api_base_url') || 'https://api.tmdb.org'
    const imageBaseUrl = await dbManager.getSetting('tmdb_image_base_url') || 'https://image.tmdb.org/t/p'
    
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

// 从数据库加载代理配置
const loadProxyConfig = async () => {
  try {
    const proxyEnabled = await dbManager.getSetting('proxy_enabled')
    const httpProxy = await dbManager.getSetting('http_proxy')
    const httpsProxy = await dbManager.getSetting('https_proxy')
    const allProxy = await dbManager.getSetting('all_proxy')
    
    if (proxyEnabled === '1') {
      return {
        proxyEnabled: true,
        httpProxy,
        httpsProxy,
        allProxy
      }
    }
    return null
  } catch (error) {
    devError('加载代理配置失败:', error)
    return null
  }
}

// 从数据库加载语言设置
const loadLanguageConfig = async () => {
  try {
    const language = await dbManager.getSetting('language') || 'zh-CN'
    return language
  } catch (error) {
    devError('加载语言配置失败:', error)
    return 'zh-CN'
  }
}

// 使用fetch进行TMDB请求，支持代理
const makeTMDBRequest = async (endpoint: string, proxyConfig?: any) => {
  try {
    const apiKey = await dbManager.getSetting('tmdb_api_key')
    const baseUrl = await dbManager.getSetting('tmdb_api_base_url') || 'https://api.tmdb.org'
    const language = await loadLanguageConfig()
    
    if (!apiKey) {
      throw new Error('TMDB API密钥未配置')
    }
    
    const url = `${baseUrl}/3${endpoint}?api_key=${apiKey}&language=${language}`
    
    devLog('TMDB请求URL:', url)
    devLog('代理配置:', proxyConfig)
    
    // 准备fetch选项
    const fetchOptions: RequestInit = {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    }
    
    // 如果启用了代理，配置代理
    if (proxyConfig && proxyConfig.proxyEnabled) {
      const proxyUrl = proxyConfig.httpsProxy || proxyConfig.httpProxy || proxyConfig.allProxy
      if (proxyUrl) {
        devLog('使用代理:', proxyUrl)
        
        // 根据代理URL类型选择代理代理
        if (proxyUrl.startsWith('https://') || proxyUrl.startsWith('http://')) {
          const agent = new HttpsProxyAgent(proxyUrl)
          // @ts-ignore - Node.js 18+ 支持
          fetchOptions.agent = agent
        } else if (proxyUrl.startsWith('socks5://')) {
          // 对于socks5代理，我们暂时不支持，可以添加 socks-proxy-agent 依赖
          devLog('警告: 暂不支持socks5代理，将使用直接连接')
        }
      }
    } else {
      devLog('直接请求，不使用代理')
    }
    
    devLog('执行fetch请求')
    const response = await fetch(url, fetchOptions)
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }
    
    const result = await response.json()
    return result
  } catch (error) {
    devError('tmdb_request_failed', error)
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
    
    // 加载代理配置
    const proxyConfig = await loadProxyConfig()
    
    let result: any
    
    switch (action) {
      case 'popular-movies':
        result = await makeTMDBRequest(`/movie/popular?page=${page}`, proxyConfig)
        break
        
      case 'top-rated-movies':
        result = await makeTMDBRequest(`/movie/top_rated?page=${page}`, proxyConfig)
        break
        
      case 'popular-tv':
        result = await makeTMDBRequest(`/tv/popular?page=${page}`, proxyConfig)
        break
        
      case 'top-rated-tv':
        result = await makeTMDBRequest(`/tv/top_rated?page=${page}`, proxyConfig)
        break
        
      case 'trending':
        result = await makeTMDBRequest(`/trending/all/day`, proxyConfig)
        break
        
      case 'movie-details':
        if (!id) throw createError({ statusCode: 400, statusMessage: 'missing_movie_id' })
        result = await makeTMDBRequest(`/movie/${id}?append_to_response=credits,videos,images,similar,recommendations`, proxyConfig)
        break
        
      case 'tv-details':
        if (!id) throw createError({ statusCode: 400, statusMessage: 'missing_tv_id' })
        result = await makeTMDBRequest(`/tv/${id}?append_to_response=credits,videos,images,similar,recommendations`, proxyConfig)
        break
        
      case 'movie-images':
        if (!id) throw createError({ statusCode: 400, statusMessage: 'missing_movie_id' })
        result = await makeTMDBRequest(`/movie/${id}/images?include_image_language=zh,en,null`, proxyConfig)
        break
        
      case 'tv-images':
        if (!id) throw createError({ statusCode: 400, statusMessage: 'missing_tv_id' })
        result = await makeTMDBRequest(`/tv/${id}/images?include_image_language=zh,en,null`, proxyConfig)
        break
        
      case 'search':
        if (!searchQuery) throw createError({ statusCode: 400, statusMessage: 'missing_search_query' })
        result = await makeTMDBRequest(`/search/multi?query=${encodeURIComponent(searchQuery)}`, proxyConfig)
        break
        
      case 'person-details':
        if (!id) throw createError({ statusCode: 400, statusMessage: 'missing_person_id' })
        result = await makeTMDBRequest(`/person/${id}?append_to_response=combined_credits`, proxyConfig)
        break
        
      case 'person-movie-credits':
        if (!id) throw createError({ statusCode: 400, statusMessage: 'missing_person_id' })
        result = await makeTMDBRequest(`/person/${id}/movie_credits`, proxyConfig)
        break
        
      case 'person-tv-credits':
        if (!id) throw createError({ statusCode: 400, statusMessage: 'missing_person_id' })
        result = await makeTMDBRequest(`/person/${id}/tv_credits`, proxyConfig)
        break
        
      case 'movie-genres':
        result = await makeTMDBRequest(`/genre/movie/list`, proxyConfig)
        break
        
      case 'tv-genres':
        result = await makeTMDBRequest(`/genre/tv/list`, proxyConfig)
        break
        
      case 'movie-recommendations':
        if (!id) throw createError({ statusCode: 400, statusMessage: 'missing_movie_id' })
        result = await makeTMDBRequest(`/movie/${id}/recommendations?page=${page}`, proxyConfig)
        break
        
      case 'tv-recommendations':
        if (!id) throw createError({ statusCode: 400, statusMessage: 'missing_tv_id' })
        result = await makeTMDBRequest(`/tv/${id}/recommendations?page=${page}`, proxyConfig)
        break
        
      case 'similar-movies':
        if (!id) throw createError({ statusCode: 400, statusMessage: 'missing_movie_id' })
        result = await makeTMDBRequest(`/movie/${id}/similar?page=${page}`, proxyConfig)
        break
        
      case 'similar-tv':
        if (!id) throw createError({ statusCode: 400, statusMessage: 'missing_tv_id' })
        result = await makeTMDBRequest(`/tv/${id}/similar?page=${page}`, proxyConfig)
        break
        
      case 'discover-movies':
        const movieParams = new URLSearchParams({
          page: page.toString()
        })
        
        if (queryParams.sort) movieParams.append('sort_by', queryParams.sort as string)
        if (queryParams.genres) movieParams.append('with_genres', queryParams.genres as string)
        if (queryParams.languages) movieParams.append('with_original_language', queryParams.languages as string)
        if (queryParams.minRating) movieParams.append('vote_average.gte', queryParams.minRating as string)
        
        result = await makeTMDBRequest(`/discover/movie?${movieParams}`, proxyConfig)
        break
        
      case 'discover-tv':
        const tvParams = new URLSearchParams({
          page: page.toString()
        })
        
        if (queryParams.sort) tvParams.append('sort_by', queryParams.sort as string)
        if (queryParams.genres) tvParams.append('with_genres', queryParams.genres as string)
        if (queryParams.languages) tvParams.append('with_original_language', queryParams.languages as string)
        if (queryParams.minRating) tvParams.append('vote_average.gte', queryParams.minRating as string)
        
        result = await makeTMDBRequest(`/discover/tv?${tvParams}`, proxyConfig)
        break
        
      default:
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