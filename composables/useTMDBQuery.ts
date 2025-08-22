import { useQuery, useMutation, useQueryClient } from '@tanstack/vue-query'
import type { 
  TMDBMovie, 
  TMDBSeries, 
  TMDBGenre, 
  TMDBResponse, 
  TMDBConfig 
} from '../types'

// 获取TMDB配置
const getTMDBConfig = async (): Promise<TMDBConfig> => {
  const response = await $fetch<{ success: boolean; data: any }>('/api/settings/tmdb')
  if (!response.success) throw new Error('获取TMDB配置失败')
  
  const proxyResponse = await $fetch<{ success: boolean; data: any }>('/api/settings/proxy')
  if (!proxyResponse.success) throw new Error('获取代理配置失败')
  
  return {
    ...response.data,
    proxyEnabled: proxyResponse.data.proxyEnabled
  }
}

// 通用TMDB请求函数
const makeTMDBRequest = async (action: string, params: Record<string, any> = {}) => {
  const config = await getTMDBConfig()
  
  if (!config.apiKey) {
    throw new Error('TMDB API密钥未配置')
  }

  // 未开启代理时，尽量直接访问 TMDB，减少一跳
  if (!config.proxyEnabled) {
    const mapActionToEndpoint = (): { path: string; query?: Record<string, any> } | null => {
      const id = params.id
      const page = params.page
      const query = params.query
      switch (action) {
        case 'popular-movies':
          return { path: '/movie/popular', query: { page } }
        case 'top-rated-movies':
          return { path: '/movie/top_rated', query: { page } }
        case 'popular-tv':
          return { path: '/tv/popular', query: { page } }
        case 'top-rated-tv':
          return { path: '/tv/top_rated', query: { page } }
        case 'trending':
          return { path: '/trending/all/day' }
        case 'movie-details':
          if (!id) return null
          return { path: `/movie/${id}`, query: { append_to_response: 'credits,videos,images,similar,recommendations' } }
        case 'tv-details':
          if (!id) return null
          return { path: `/tv/${id}`, query: { append_to_response: 'credits,videos,images,similar,recommendations' } }
        case 'movie-images':
          if (!id) return null
          return { path: `/movie/${id}/images`, query: { include_image_language: 'zh,en,null' } }
        case 'tv-images':
          if (!id) return null
          return { path: `/tv/${id}/images`, query: { include_image_language: 'zh,en,null' } }
        case 'search':
          if (!query) return null
          return { path: '/search/multi', query: { query } }
        case 'person-details':
          if (!id) return null
          return { path: `/person/${id}`, query: { append_to_response: 'combined_credits' } }
        case 'person-movie-credits':
          if (!id) return null
          return { path: `/person/${id}/movie_credits` }
        case 'person-tv-credits':
          if (!id) return null
          return { path: `/person/${id}/tv_credits` }
        case 'movie-genres':
          return { path: '/genre/movie/list' }
        case 'tv-genres':
          return { path: '/genre/tv/list' }
        case 'movie-recommendations':
          if (!id) return null
          return { path: `/movie/${id}/recommendations`, query: { page } }
        case 'tv-recommendations':
          if (!id) return null
          return { path: `/tv/${id}/recommendations`, query: { page } }
        case 'similar-movies':
          if (!id) return null
          return { path: `/movie/${id}/similar`, query: { page } }
        case 'similar-tv':
          if (!id) return null
          return { path: `/tv/${id}/similar`, query: { page } }
        case 'discover-movies': {
          const q = {
            sort_by: params.sort,
            with_genres: params.genres,
            with_original_language: params.languages,
            page: params.page,
            'vote_average.gte': params.minRating,
          }
          return { path: '/discover/movie', query: q }
        }
        case 'discover-tv': {
          const q = {
            sort_by: params.sort,
            with_genres: params.genres,
            with_original_language: params.languages,
            page: params.page,
            'vote_average.gte': params.minRating,
          }
          return { path: '/discover/tv', query: q }
        }
        default:
          return null
      }
    }

    const mapped = mapActionToEndpoint()
    if (mapped) {
      const baseQuery: Record<string, any> = {
        api_key: config.apiKey,
        language: 'zh-CN',
      }
      const extra = Object.fromEntries(
        Object.entries(mapped.query || {}).filter(([, v]) => v !== undefined && v !== null && v !== '')
      )
      const search = new URLSearchParams({ ...baseQuery, ...extra })
      const url = `${config.apiBaseUrl}/3${mapped.path}?${search.toString()}`
      console.log('直接请求TMDB:', url)
      return await $fetch(url)
    }
  }

  // 走后端，由后端决定是否使用代理
  console.log('通过后端API请求TMDB:', action)
  const response = await $fetch<{ success: boolean; data: any }>('/api/tmdb', {
    query: { action, ...params }
  })
  if (!response.success) throw new Error('TMDB请求失败')
  return response.data
}

export const useTMDBQuery = () => {
  const queryClient = useQueryClient()

  // TMDB配置缓存查询
  const tmdbConfigQuery = useQuery({
    queryKey: ['tmdb', 'config'],
    queryFn: getTMDBConfig,
    staleTime: 1000 * 60 * 10, // 10分钟
    gcTime: 1000 * 60 * 30,    // 30分钟
    refetchOnWindowFocus: false, // 窗口聚焦时不重新获取
    refetchOnMount: true,       // 组件挂载时重新获取
    refetchOnReconnect: true,   // 网络重连时重新获取
  })

  // 监听配置变更，自动刷新相关查询
  watchEffect(() => {
    if (tmdbConfigQuery.data?.value) {
      const config = tmdbConfigQuery.data.value
      // 当配置变更时，清除所有TMDB相关的查询缓存
      // 这样下次请求时会使用新的配置
      queryClient.removeQueries({ 
        queryKey: ['tmdb'],
        exact: false 
      })
    }
  })

  // 获取热门电影
  const getPopularMovies = (page = 1) => {
    return useQuery({
      queryKey: ['tmdb', 'popular-movies', page],
      queryFn: () => makeTMDBRequest('popular-movies', { page }),
      staleTime: 1000 * 60 * 5, // 5分钟
      gcTime: 1000 * 60 * 10,   // 10分钟
      enabled: !!tmdbConfigQuery.data?.value?.apiKey, // 只有在配置加载完成后才启用
    })
  }

  // 获取高分电影
  const getTopRatedMovies = (page = 1) => {
    return useQuery({
      queryKey: ['tmdb', 'top-rated-movies', page],
      queryFn: () => makeTMDBRequest('top-rated-movies', { page }),
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 10,
      enabled: !!tmdbConfigQuery.data?.value?.apiKey,
    })
  }

  // 获取热门剧集
  const getPopularTV = (page = 1) => {
    return useQuery({
      queryKey: ['tmdb', 'popular-tv', page],
      queryFn: () => makeTMDBRequest('popular-tv', { page }),
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 10,
      enabled: !!tmdbConfigQuery.data?.value?.apiKey,
    })
  }

  // 获取高分剧集
  const getTopRatedTV = (page = 1) => {
    return useQuery({
      queryKey: ['tmdb', 'top-rated-tv', page],
      queryFn: () => makeTMDBRequest('top-rated-tv', { page }),
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 10,
      enabled: !!tmdbConfigQuery.data?.value?.apiKey,
    })
  }

  // 获取趋势内容
  const getTrending = () => {
    return useQuery({
      queryKey: ['tmdb', 'trending'],
      queryFn: () => makeTMDBRequest('trending'),
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 10,
      enabled: !!tmdbConfigQuery.data?.value?.apiKey,
    })
  }

  // 获取电影详情
  const getMovieDetails = (id: number) => {
    return useQuery({
      queryKey: ['tmdb', 'movie-details', id],
      queryFn: () => makeTMDBRequest('movie-details', { id }),
      staleTime: 1000 * 60 * 10, // 电影详情缓存更长时间
      gcTime: 1000 * 60 * 20,
      enabled: !!id && !!tmdbConfigQuery.data?.value?.apiKey,
    })
  }

  // 获取剧集详情
  const getTVDetails = (id: number) => {
    return useQuery({
      queryKey: ['tmdb', 'tv-details', id],
      queryFn: () => makeTMDBRequest('tv-details', { id }),
      staleTime: 1000 * 60 * 10,
      gcTime: 1000 * 60 * 20,
      enabled: !!id && !!tmdbConfigQuery.data?.value?.apiKey,
    })
  }

  // 获取电影图片 - 直接构建URL，不需要API请求
  const getMovieImages = (id: number) => {
    return useQuery({
      queryKey: ['tmdb', 'movie-images', id],
      queryFn: () => makeTMDBRequest('movie-images', { id }),
      staleTime: 1000 * 60 * 30, // 图片缓存更长时间
      gcTime: 1000 * 60 * 60,
      enabled: !!id && !!tmdbConfigQuery.data?.value?.apiKey,
    })
  }

  // 获取剧集图片 - 直接构建URL，不需要API请求
  const getTVImages = (id: number) => {
    return useQuery({
      queryKey: ['tmdb', 'tv-images', id],
      queryFn: () => makeTMDBRequest('tv-images', { id }),
      staleTime: 1000 * 60 * 30,
      gcTime: 1000 * 60 * 60,
      enabled: !!id && !!tmdbConfigQuery.data?.value?.apiKey,
    })
  }

  // 构建图片URL - 直接使用配置，无需API请求
  const buildImageUrl = (path: string, size: string = 'w500', type: 'poster' | 'backdrop' | 'profile' = 'poster') => {
    if (!path) return null
    
    const config = tmdbConfigQuery.data?.value
    if (!config?.imageBaseUrl) return null
    
    // 根据类型选择不同的路径
    let imagePath = ''
    switch (type) {
      case 'poster':
        imagePath = '/t/p'
        break
      case 'backdrop':
        imagePath = '/t/p'
        break
      case 'profile':
        imagePath = '/t/p'
        break
      default:
        imagePath = '/t/p'
    }
    
    return `${config.imageBaseUrl}${imagePath}/${size}${path}`
  }

  // 构建海报URL
  const buildPosterUrl = (path: string, size: string = 'w500') => {
    return buildImageUrl(path, size, 'poster')
  }

  // 构建背景图URL
  const buildBackdropUrl = (path: string, size: string = 'w1280') => {
    return buildImageUrl(path, size, 'backdrop')
  }

  // 构建头像URL
  const buildProfileUrl = (path: string, size: string = 'w185') => {
    return buildImageUrl(path, size, 'profile')
  }

  // 获取可用的图片尺寸
  const getImageSizes = () => {
    return {
      poster: ['w92', 'w154', 'w185', 'w342', 'w500', 'w780', 'original'],
      backdrop: ['w300', 'w780', 'w1280', 'original'],
      profile: ['w45', 'w185', 'h632', 'original'],
      still: ['w92', 'w185', 'w300', 'original']
    }
  }

  // 搜索内容
  const searchContent = (query: string) => {
    return useQuery({
      queryKey: ['tmdb', 'search', query],
      queryFn: () => makeTMDBRequest('search', { query }),
      staleTime: 1000 * 60 * 2, // 搜索结果缓存时间较短
      gcTime: 1000 * 60 * 5,
      enabled: !!query && !!tmdbConfigQuery.data?.value?.apiKey,
    })
  }

  // 获取人物详情
  const getPersonDetails = (id: number) => {
    return useQuery({
      queryKey: ['tmdb', 'person-details', id],
      queryFn: () => makeTMDBRequest('person-details', { id }),
      staleTime: 1000 * 60 * 10,
      gcTime: 1000 * 60 * 20,
      enabled: !!id && !!tmdbConfigQuery.data?.value?.apiKey,
    })
  }

  // 获取电影类型
  const getMovieGenres = () => {
    return useQuery({
      queryKey: ['tmdb', 'movie-genres'],
      queryFn: () => makeTMDBRequest('movie-genres'),
      staleTime: 1000 * 60 * 60, // 类型列表缓存更长时间
      gcTime: 1000 * 60 * 120,
      enabled: !!tmdbConfigQuery.data?.value?.apiKey,
    })
  }

  // 获取剧集类型
  const getTVGenres = () => {
    return useQuery({
      queryKey: ['tmdb', 'tv-genres'],
      queryFn: () => makeTMDBRequest('tv-genres'),
      staleTime: 1000 * 60 * 60,
      gcTime: 1000 * 60 * 120,
      enabled: !!tmdbConfigQuery.data?.value?.apiKey,
    })
  }

  // 发现电影
  const discoverMovies = (params: {
    page?: number
    sort?: string
    genres?: string
    languages?: string
    minRating?: string
  }) => {
    return useQuery({
      queryKey: ['tmdb', 'discover-movies', params],
      queryFn: () => makeTMDBRequest('discover-movies', params),
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 10,
      enabled: !!tmdbConfigQuery.data?.value?.apiKey,
    })
  }

  // 发现剧集
  const discoverTV = (params: {
    page?: number
    sort?: string
    genres?: string
    languages?: string
    minRating?: string
  }) => {
    return useQuery({
      queryKey: ['tmdb', 'discover-tv', params],
      queryFn: () => makeTMDBRequest('discover-tv', params),
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 10,
      enabled: !!tmdbConfigQuery.data?.value?.apiKey,
    })
  }

  // 清除缓存
  const clearCache = () => {
    queryClient.clear()
  }

  // 清除特定查询的缓存
  const clearQueryCache = (queryKey: string[]) => {
    queryClient.removeQueries({ queryKey })
  }

  // 预取查询
  const prefetchQuery = (queryKey: string[], queryFn: () => Promise<any>) => {
    queryClient.prefetchQuery({
      queryKey,
      queryFn,
      staleTime: 1000 * 60 * 5,
    })
  }

  // 刷新TMDB配置
  const refreshTMDBConfig = () => {
    return tmdbConfigQuery.refetch()
  }

  // 清除TMDB配置缓存
  const clearTMDBConfigCache = () => {
    queryClient.removeQueries({ queryKey: ['tmdb', 'config'] })
  }

  // 获取配置状态
  const getConfigStatus = () => {
    return {
      isLoading: tmdbConfigQuery.isPending,
      isError: tmdbConfigQuery.isError,
      error: tmdbConfigQuery.error,
      data: tmdbConfigQuery.data?.value,
      isStale: tmdbConfigQuery.isStale,
    }
  }

  return {
    // 查询函数
    getPopularMovies,
    getTopRatedMovies,
    getPopularTV,
    getTopRatedTV,
    getTrending,
    getMovieDetails,
    getTVDetails,
    getMovieImages,
    getTVImages,
    searchContent,
    getPersonDetails,
    getMovieGenres,
    getTVGenres,
    discoverMovies,
    discoverTV,
    
    // 图片URL构建（无需API请求）
    buildImageUrl,
    buildPosterUrl,
    buildBackdropUrl,
    buildProfileUrl,
    getImageSizes,
    
    // 缓存管理
    clearCache,
    clearQueryCache,
    prefetchQuery,
    
    // 配置管理
    refreshTMDBConfig,
    clearTMDBConfigCache,
    getConfigStatus,
    
    // 获取配置（保持向后兼容）
    getTMDBConfig,
  }
}