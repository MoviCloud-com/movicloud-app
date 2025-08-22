// 前端TMDB客户端，调用服务端API
import type { TMDBMovie, TMDBSeries, TMDBGenre, TMDBResponse } from '../types'
import { getCurrentLanguage } from './useI18n'

// 图片基础域名内存缓存（模块级，跨实例共享）
let cachedImageBaseUrl: string | null = null
let imageBaseUrlFetchedAt = 0
const IMAGE_BASE_TTL_MS = 10 * 60 * 1000 // 10分钟
let imageBaseUrlInFlight: Promise<string> | null = null

// 通用请求去重与结果缓存（模块级）
const inFlightRequests = new Map<string, Promise<any>>()
const responseCache = new Map<string, { ts: number; data: any }>()
const RESPONSE_TTL_MS = 5 * 60 * 1000 // 5分钟

// TMDB 配置缓存（模块级）
let cachedTMDBConfig: any | null = null
let tmdbConfigFetchedAt = 0
const CONFIG_TTL_MS = 10 * 60 * 1000 // 10分钟
let tmdbConfigInFlight: Promise<any> | null = null

export const useTMDBClient = () => {
	const imageUrlCache = ref<Map<string, string>>(new Map())

	// 获取TMDB配置（带TTL缓存 + 并发去重）
	const getTMDBConfig = async () => {
		const now = Date.now()
		if (cachedTMDBConfig && now - tmdbConfigFetchedAt < CONFIG_TTL_MS) {
			return cachedTMDBConfig
		}
		if (tmdbConfigInFlight) return tmdbConfigInFlight
		tmdbConfigInFlight = (async () => {
			try {
				const response = await $fetch<{ success: boolean; data: any }>('/api/settings/tmdb')
				if (!response.success) throw new Error('获取TMDB配置失败')
				cachedTMDBConfig = response.data
				tmdbConfigFetchedAt = Date.now()
				return cachedTMDBConfig
			} finally {
				tmdbConfigInFlight = null
			}
		})()
		return tmdbConfigInFlight
	}

	// 通用TMDB请求函数（带去重 + 结果缓存）
	const makeTMDBRequest = async (endpoint: string, params: Record<string, any> = {}) => {
		const config = await getTMDBConfig()
		const { apiKey, apiBaseUrl, proxyEnabled } = config
		
		if (!apiKey) {
			throw new Error('TMDB API密钥未配置')
		}

		// 获取当前语言设置并映射到TMDB API支持的语言代码
		// 影视标题会根据用户选择的语言来显示对应的语言版本
		const appLanguage = getCurrentLanguage()
		const currentLanguage = appLanguage === 'zh-TW' ? 'zh-TW' : 
							   appLanguage === 'en-US' ? 'en-US' : 'zh-CN'

		// 构建查询参数
		const queryParams = new URLSearchParams({
			api_key: apiKey,
			language: currentLanguage,
			...params
		})

		const directUrl = `${apiBaseUrl}/3${endpoint}?${queryParams.toString()}`
		const backendKey = `backend:${endpoint}:${JSON.stringify(params)}`
		const requestKey = proxyEnabled ? backendKey : `direct:${directUrl}`

		// 命中结果缓存
		const cached = responseCache.get(requestKey)
		if (cached && Date.now() - cached.ts < RESPONSE_TTL_MS) {
			return cached.data
		}

		// 并发去重
		const existing = inFlightRequests.get(requestKey)
		if (existing) return existing

		const exec = (async () => {
			try {
				if (proxyEnabled) {
					const response = await $fetch<{ success: boolean; data: any }>('/api/tmdb', {
						query: { action: endpoint.replace('/', '-').replace(/^\//, ''), ...params }
					})
					if (!response.success) throw new Error('TMDB请求失败')
					responseCache.set(requestKey, { ts: Date.now(), data: response.data })
					return response.data
				} else {
					const data = await $fetch(directUrl)
					responseCache.set(requestKey, { ts: Date.now(), data })
					return data
				}
			} finally {
				inFlightRequests.delete(requestKey)
			}
		})()

		inFlightRequests.set(requestKey, exec)
		return exec
	}

	// 获取图片基础URL（带TTL缓存 + 并发去重）
	const getImageBaseUrl = async (): Promise<string> => {
		const now = Date.now()
		if (cachedImageBaseUrl && now - imageBaseUrlFetchedAt < IMAGE_BASE_TTL_MS) {
			return cachedImageBaseUrl
		}
		if (imageBaseUrlInFlight) {
			return imageBaseUrlInFlight
		}

		imageBaseUrlInFlight = (async (): Promise<string> => {
			try {
				const config = await getTMDBConfig()
				// 配置中保存的是域名部分，例如 https://image.tmdb.org
				const base = (config.imageBaseUrl && config.imageBaseUrl.trim()) || 'https://image.tmdb.org'
				cachedImageBaseUrl = base
				imageBaseUrlFetchedAt = Date.now()
				return cachedImageBaseUrl!
			} finally {
				// 完成后释放占位，允许后续刷新
				imageBaseUrlInFlight = null
			}
		})()

		return imageBaseUrlInFlight
	}

	// 清除图片URL缓存（同时清理基础域名缓存 与 请求缓存 与 配置缓存）
	const clearImageUrlCache = () => {
		imageUrlCache.value.clear()
		cachedImageBaseUrl = null
		imageBaseUrlFetchedAt = 0
		imageBaseUrlInFlight = null
		inFlightRequests.clear()
		responseCache.clear()
		cachedTMDBConfig = null
		tmdbConfigFetchedAt = 0
		tmdbConfigInFlight = null
	}

	// 清除所有缓存（用于语言切换时）
	const clearAllCache = () => {
		clearImageUrlCache()
	}

	// 获取热门电影
	const getPopularMovies = async (page = 1): Promise<TMDBResponse<TMDBMovie>> => {
		return await makeTMDBRequest('/movie/popular', { page })
	}

	// 获取高分电影
	const getTopRatedMovies = async (page = 1): Promise<TMDBResponse<TMDBMovie>> => {
		return await makeTMDBRequest('/movie/top_rated', { page })
	}

	// 获取热门电视剧
	const getPopularTVShows = async (page = 1): Promise<TMDBResponse<TMDBSeries>> => {
		return await makeTMDBRequest('/tv/popular', { page })
	}

	// 获取高分电视剧
	const getTopRatedTVShows = async (page = 1): Promise<TMDBResponse<TMDBSeries>> => {
		return await makeTMDBRequest('/tv/top_rated', { page })
	}

	// 获取今日趋势
	const getTrendingToday = async (): Promise<TMDBResponse<TMDBMovie | TMDBSeries>> => {
		return await makeTMDBRequest('/trending/all/day')
	}

	// 获取电影详情
	const getMovieDetails = async (movieId: number) => {
		return await makeTMDBRequest(`/movie/${movieId}`, {
			append_to_response: 'credits,videos,images,similar,recommendations'
		})
	}

	// 获取电视剧详情
	const getTVShowDetails = async (tvId: number) => {
		return await makeTMDBRequest(`/tv/${tvId}`, {
			append_to_response: 'credits,videos,images,similar,recommendations'
		})
	}

	// 获取电影图片
	const getMovieImages = async (movieId: number) => {
		return await makeTMDBRequest(`/movie/${movieId}/images`, {
			include_image_language: 'zh,en,null'
		})
	}

	// 获取电视剧图片
	const getTVShowImages = async (tvId: number) => {
		return await makeTMDBRequest(`/tv/${tvId}/images`, {
			include_image_language: 'zh,en,null'
		})
	}

	// 搜索电影、电视剧和演员
	const searchMulti = async (query: string) => {
		return await makeTMDBRequest('/search/multi', { query })
	}

	// 获取演员详情
	const getPersonDetails = async (personId: number) => {
		return await makeTMDBRequest(`/person/${personId}`, {
			append_to_response: 'combined_credits'
		})
	}

	// 获取演员电影作品
	const getPersonMovieCredits = async (personId: number) => {
		return await makeTMDBRequest(`/person/${personId}/movie_credits`)
	}

	// 获取演员电视剧作品
	const getPersonTVCredits = async (personId: number) => {
		return await makeTMDBRequest(`/person/${personId}/tv_credits`)
	}

	// 获取电影类型
	const getMovieGenres = async (): Promise<{ genres: TMDBGenre[] }> => {
		return await makeTMDBRequest('/genre/movie/list')
	}

	// 获取电视剧类型
	const getTVGenres = async (): Promise<{ genres: TMDBGenre[] }> => {
		return await makeTMDBRequest('/genre/tv/list')
	}

	// 获取电影推荐
	const getMovieRecommendations = async (movieId: number, page = 1): Promise<TMDBResponse<TMDBMovie>> => {
		return await makeTMDBRequest(`/movie/${movieId}/recommendations`, { page })
	}

	// 获取电视剧推荐
	const getTVShowRecommendations = async (tvId: number, page = 1): Promise<TMDBResponse<TMDBSeries>> => {
		return await makeTMDBRequest(`/tv/${tvId}/recommendations`, { page })
	}

	// 获取相似电影
	const getSimilarMovies = async (movieId: number, page = 1): Promise<TMDBResponse<TMDBMovie>> => {
		return await makeTMDBRequest(`/movie/${movieId}/similar`, { page })
	}

	// 获取相似电视剧
	const getSimilarTVShows = async (tvId: number, page = 1): Promise<TMDBResponse<TMDBSeries>> => {
		return await makeTMDBRequest(`/tv/${tvId}/similar`, { page })
	}

	// 获取筛选后的电影列表
	const getFilteredMovies = async (filters: {
		sort?: string
		genres?: number[]
		languages?: string[]
		minRating?: number
		page?: number
	}) => {
		const query: Record<string, any> = { page: (filters.page || 1).toString() }
		if (filters.sort) query.sort_by = filters.sort
		if (filters.genres && filters.genres.length > 0) query.with_genres = filters.genres.join(',')
		if (filters.languages && filters.languages.length > 0) query.with_original_language = filters.languages.join('|')
		if (filters.minRating && filters.minRating > 0) query['vote_average.gte'] = filters.minRating.toString()

		return await makeTMDBRequest('/discover/movie', query)
	}

	// 获取筛选后的电视剧列表
	const getFilteredTVShows = async (filters: {
		sort?: string
		genres?: number[]
		languages?: string[]
		minRating?: number
		page?: number
	}) => {
		const query: Record<string, any> = { page: (filters.page || 1).toString() }
		if (filters.sort) query.sort_by = filters.sort
		if (filters.genres && filters.genres.length > 0) query.with_genres = filters.genres.join(',')
		if (filters.languages && filters.languages.length > 0) query.with_original_language = filters.languages.join('|')
		if (filters.minRating && filters.minRating > 0) query['vote_average.gte'] = filters.minRating.toString()

		return await makeTMDBRequest('/discover/tv', query)
	}

	// 获取图片URL
	const getImageUrl = async (path: string, size: 'w92' | 'w154' | 'w185' | 'w342' | 'w500' | 'w780' | 'original' = 'w500') => {
		const baseUrl = await getImageBaseUrl()
		if (!path) return ''
		return `${baseUrl}/t/p/${size}${path}`
	}

	// 获取背景图片URL
	const getBackdropUrl = async (path: string, size: 'w300' | 'w780' | 'w1280' | 'original' = 'w1280') => {
		const baseUrl = await getImageBaseUrl()
		if (!path) return ''
		return `${baseUrl}/t/p/${size}${path}`
	}

	// 获取logo URL
	const getLogoUrl = async (path: string, size: 'w45' | 'w92' | 'w154' | 'w185' | 'w300' | 'w500' | 'original' = 'w500') => {
		const baseUrl = await getImageBaseUrl()
		if (!path) return ''
		return `${baseUrl}/t/p/${size}${path}`
	}

	return {
		getPopularMovies,
		getTopRatedMovies,
		getPopularTVShows,
		getTopRatedTVShows,
		getTrendingToday,
		getMovieDetails,
		getTVShowDetails,
		getMovieImages,
		getTVShowImages,
		searchMulti,
		getPersonDetails,
		getPersonMovieCredits,
		getPersonTVCredits,
		getMovieGenres,
		getTVGenres,
		getFilteredMovies,
		getFilteredTVShows,
		getImageUrl,
		getBackdropUrl,
		getLogoUrl,
		getMovieRecommendations,
		getTVShowRecommendations,
		getSimilarMovies,
		getSimilarTVShows,
		clearImageUrlCache,
		clearAllCache
	}
} 