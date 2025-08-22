import { ref, computed, readonly } from 'vue'

// 设置缓存接口
interface SettingsCache {
  tmdb: {
    apiKey: string
    apiBaseUrl: string
    imageBaseUrl: string
    proxyEnabled: boolean
    proxyUrl: string
  }
  general: {
    language: string
    theme: string
  }
  proxy: {
    enabled: boolean
    url: string
  }
}

// 缓存键名
const CACHE_KEYS = {
  SETTINGS: 'movicloud_settings_cache',
  LAST_UPDATE: 'movicloud_settings_last_update'
} as const

// 缓存过期时间（5分钟）
const CACHE_EXPIRY = 5 * 60 * 1000

// 设置缓存状态
const settingsCache = ref<SettingsCache | null>(null)
const isLoading = ref(false)
const lastUpdate = ref<number>(0)

// 从localStorage获取缓存
const getCacheFromStorage = (): SettingsCache | null => {
  try {
    const cached = localStorage.getItem(CACHE_KEYS.SETTINGS)
    const lastUpdateTime = localStorage.getItem(CACHE_KEYS.LAST_UPDATE)
    
    if (!cached || !lastUpdateTime) return null
    
    const timestamp = parseInt(lastUpdateTime)
    const now = Date.now()
    
    // 检查缓存是否过期
    if (now - timestamp > CACHE_EXPIRY) {
      clearCache()
      return null
    }
    
    return JSON.parse(cached)
  } catch (error) {
    console.error('读取设置缓存失败:', error)
    return null
  }
}

// 保存缓存到localStorage
const saveCacheToStorage = (settings: SettingsCache) => {
  try {
    localStorage.setItem(CACHE_KEYS.SETTINGS, JSON.stringify(settings))
    localStorage.setItem(CACHE_KEYS.LAST_UPDATE, Date.now().toString())
  } catch (error) {
    console.error('保存设置缓存失败:', error)
  }
}

// 清除缓存
const clearCache = () => {
  try {
    localStorage.removeItem(CACHE_KEYS.SETTINGS)
    localStorage.removeItem(CACHE_KEYS.LAST_UPDATE)
    settingsCache.value = null
    lastUpdate.value = 0
  } catch (error) {
    console.error('清除设置缓存失败:', error)
  }
}

// 获取TMDB设置
const fetchTMDBSettings = async () => {
  try {
    const response = await $fetch<{success: boolean, data?: any, message?: string}>('/api/settings/tmdb')
    if (response.success && response.data) {
      return response.data
    }
    throw new Error('获取TMDB设置失败')
  } catch (error) {
    console.error('获取TMDB设置失败:', error)
    // 返回默认值
    return {
      apiKey: '',
      apiBaseUrl: 'https://api.tmdb.org',
      imageBaseUrl: 'https://image.tmdb.org',
      proxyEnabled: false,
      proxyUrl: ''
    }
  }
}

// 获取通用设置
const fetchGeneralSettings = async () => {
  try {
    const [languageRes, themeRes] = await Promise.all([
      $fetch<{success: boolean, data?: string}>('/api/settings/language'),
      $fetch<{success: boolean, data?: string}>('/api/settings/theme')
    ])
    
    return {
      language: languageRes.success && languageRes.data ? languageRes.data : 'zh-CN',
      theme: themeRes.success && themeRes.data ? themeRes.data : 'light'
    }
  } catch (error) {
    console.error('获取通用设置失败:', error)
    return {
      language: 'zh-CN',
      theme: 'light'
    }
  }
}

// 获取代理设置
const fetchProxySettings = async () => {
  try {
    const response = await $fetch<{success: boolean, data?: any, message?: string}>('/api/settings/proxy')
    if (response.success && response.data) {
      return response.data
    }
    throw new Error('获取代理设置失败')
  } catch (error) {
    console.error('获取代理设置失败:', error)
    return {
      enabled: false,
      url: ''
    }
  }
}

// 初始化设置缓存
const initializeSettings = async (forceRefresh = false) => {
  if (isLoading.value) return
  
  try {
    isLoading.value = true
    
    // 如果不是强制刷新，先尝试从缓存获取
    if (!forceRefresh) {
      const cached = getCacheFromStorage()
      if (cached) {
        settingsCache.value = cached
        lastUpdate.value = Date.now()
        return
      }
    }
    
    // 从服务器获取最新设置
    const [tmdbSettings, generalSettings, proxySettings] = await Promise.all([
      fetchTMDBSettings(),
      fetchGeneralSettings(),
      fetchProxySettings()
    ])
    
    const newSettings: SettingsCache = {
      tmdb: tmdbSettings,
      general: generalSettings,
      proxy: proxySettings
    }
    
    // 更新缓存
    settingsCache.value = newSettings
    lastUpdate.value = Date.now()
    saveCacheToStorage(newSettings)
    
  } catch (error) {
    console.error('初始化设置失败:', error)
  } finally {
    isLoading.value = false
  }
}

// 刷新设置缓存
const refreshSettings = () => {
  return initializeSettings(true)
}

// 计算属性：TMDB图片基础URL
const tmdbImageBaseUrl = computed(() => {
  return settingsCache.value?.tmdb.imageBaseUrl || 'https://image.tmdb.org'
})

// 计算属性：TMDB API基础URL
const tmdbApiBaseUrl = computed(() => {
  return settingsCache.value?.tmdb.apiBaseUrl || 'https://api.tmdb.org'
})

// 计算属性：TMDB API密钥
const tmdbApiKey = computed(() => {
  return settingsCache.value?.tmdb.apiKey || ''
})

// 计算属性：代理设置
const proxySettings = computed(() => {
  return settingsCache.value?.proxy || { enabled: false, url: '' }
})

// 计算属性：通用设置
const generalSettings = computed(() => {
  return settingsCache.value?.general || { language: 'zh-CN', theme: 'light' }
})

export const useSettingsCache = () => {
  return {
    // 状态
    settingsCache: readonly(settingsCache),
    isLoading: readonly(isLoading),
    lastUpdate: readonly(lastUpdate),
    
    // 计算属性
    tmdbImageBaseUrl,
    tmdbApiBaseUrl,
    tmdbApiKey,
    proxySettings,
    generalSettings,
    
    // 方法
    initializeSettings,
    refreshSettings,
    clearCache
  }
} 