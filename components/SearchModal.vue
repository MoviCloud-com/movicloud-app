<template>
  <div v-if="visible" class="fixed inset-0 z-50 flex items-center justify-center">
    <!-- 背景遮罩 -->
    <div 
      class="absolute inset-0 bg-black/50 backdrop-blur-sm"
      @click="closeModal"
    ></div>
    
    <!-- 模态框内容 -->
    <div class="relative w-full max-w-2xl mx-4 bg-surface-0 dark:bg-surface-900 rounded-xl shadow-2xl border border-surface-200 dark:border-surface-700">
      <!-- 搜索输入框 -->
      <div class="p-6 border-b border-surface-200 dark:border-surface-700">
        <div class="relative">
          <input
            ref="searchInput"
            v-model="searchQuery"
            type="text"
            :placeholder="t('search_placeholder')"
            class="w-full pl-12 pr-4 py-3 text-lg bg-surface-50 dark:bg-surface-800 border border-surface-200 dark:border-surface-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
            @input="handleSearch"
            @keydown.esc="closeModal"
          />
          <i class="pi pi-search absolute left-4 top-1/2 -translate-y-1/2 text-surface-400 text-lg"></i>
        </div>
      </div>
      
      <!-- 搜索结果 -->
      <div class="max-h-96 overflow-y-auto">
        <div v-if="loading" class="p-6 text-center">
          <i class="pi pi-spin pi-spinner text-2xl text-primary-500"></i>
          <p class="mt-2 text-surface-600 dark:text-surface-400">{{ t('searching') }}</p>
        </div>
        
        <div v-else-if="searchQuery && !loading">
          <!-- 电影结果 -->
          <div v-if="movieResults.length > 0" class="p-4">
            <h3 class="text-sm font-semibold text-surface-500 dark:text-surface-400 mb-3">{{ t('movies') }}</h3>
            <div class="space-y-2">
              <div
                v-for="movie in movieResults"
                :key="movie.id"
                class="flex items-center gap-3 p-2 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800 cursor-pointer transition-colors"
                @click="goToDetail('movie', movie.id)"
              >
                <img
                  :src="movie.posterUrl || ''"
                  :alt="movie.title"
                  class="w-12 h-18 object-cover rounded"
                />
                <div class="flex-1">
                  <h4 class="font-medium text-surface-900 dark:text-surface-100">{{ movie.title }}</h4>
                  <p class="text-sm text-surface-600 dark:text-surface-400">{{ movie.release_date?.split('-')[0] }}</p>
                </div>
                <div class="flex items-center gap-1 text-sm text-surface-500 dark:text-surface-400">
                  <i class="pi pi-star-fill text-yellow-500"></i>
                  <span>{{ movie.vote_average?.toFixed(1) }}</span>
                </div>
              </div>
            </div>
          </div>
          
          <!-- 电视剧结果 -->
          <div v-if="tvResults.length > 0" class="p-4">
            <h3 class="text-sm font-semibold text-surface-500 dark:text-surface-400 mb-3">{{ t('tv_shows') }}</h3>
            <div class="space-y-2">
              <div
                v-for="tv in tvResults"
                :key="tv.id"
                class="flex items-center gap-3 p-2 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800 cursor-pointer transition-colors"
                @click="goToDetail('tv', tv.id)"
              >
                <img
                  :src="tv.posterUrl || ''"
                  :alt="tv.name"
                  class="w-12 h-18 object-cover rounded"
                />
                <div class="flex-1">
                  <h4 class="font-medium text-surface-900 dark:text-surface-100">{{ tv.name }}</h4>
                  <p class="text-sm text-surface-600 dark:text-surface-400">{{ tv.first_air_date?.split('-')[0] }}</p>
                </div>
                <div class="flex items-center gap-1 text-sm text-surface-500 dark:text-surface-400">
                  <i class="pi pi-star-fill text-yellow-500"></i>
                  <span>{{ tv.vote_average?.toFixed(1) }}</span>
                </div>
              </div>
            </div>
          </div>
          
          <!-- 演员结果 -->
          <div v-if="personResults.length > 0" class="p-4">
            <h3 class="text-sm font-semibold text-surface-500 dark:text-surface-400 mb-3">{{ t('actors') }}</h3>
            <div class="space-y-2">
              <div
                v-for="person in personResults"
                :key="person.id"
                class="flex items-center gap-3 p-2 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800 cursor-pointer transition-colors"
                @click="goToPerson(person.id)"
              >
                <img
                  :src="person.profileUrl || ''"
                  :alt="person.name"
                  class="w-12 h-12 object-cover rounded-full"
                />
                <div class="flex-1">
                  <h4 class="font-medium text-surface-900 dark:text-surface-100">{{ person.name }}</h4>
                  <p class="text-sm text-surface-600 dark:text-surface-400">{{ person.known_for_department }}</p>
                </div>
              </div>
            </div>
          </div>
          
          <!-- 无结果 -->
          <div v-if="!loading && movieResults.length === 0 && tvResults.length === 0 && personResults.length === 0" class="p-6 text-center">
            <i class="pi pi-search text-4xl text-surface-300 dark:text-surface-600"></i>
            <p class="mt-2 text-surface-600 dark:text-surface-400">{{ t('no_search_results') }}</p>
          </div>
        </div>
        
        <!-- 最近搜索 -->
        <div v-else-if="recentSearches.length > 0" class="p-4">
          <div class="flex items-center justify-between mb-3">
            <h3 class="text-sm font-semibold text-surface-500 dark:text-surface-400">{{ t('recent_searches') }}</h3>
            <button 
              @click="clearRecentSearches"
              class="text-xs text-surface-400 hover:text-surface-600 dark:hover:text-surface-300 transition-colors"
            >
              {{ t('clear_recent_searches') }}
            </button>
          </div>
          <div class="space-y-2">
            <div
              v-for="(searchTerm, index) in recentSearches"
              :key="index"
              class="flex items-center gap-3 p-2 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-800 cursor-pointer transition-colors"
              @click="searchFromHistory(searchTerm)"
            >
              <i class="pi pi-history text-surface-400 text-sm"></i>
              <span class="text-surface-700 dark:text-surface-300">{{ searchTerm }}</span>
            </div>
          </div>
        </div>
        
        <!-- 默认状态 -->
        <div v-else class="p-6 text-center">
          <i class="pi pi-search text-4xl text-surface-300 dark:text-surface-600"></i>
          <p class="mt-2 text-surface-600 dark:text-surface-400">{{ t('start_search') }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useTMDBClient } from '../composables/useTMDBClient'
import { t } from '../composables/useI18n'

interface Props {
  visible: boolean
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'update:visible': [value: boolean]
}>()

const router = useRouter()
const { getImageUrl, searchMulti } = useTMDBClient()

// 搜索相关
const searchInput = ref<HTMLInputElement>()
const searchQuery = ref('')
const loading = ref(false)
const movieResults = ref<any[]>([])
const tvResults = ref<any[]>([])
const personResults = ref<any[]>([])

// 最近搜索相关
const recentSearches = ref<string[]>([])
const MAX_RECENT_SEARCHES = 5

// 图片URL缓存
const imageUrlCache = ref<Map<string, string>>(new Map())

// 获取图片URL的异步函数
const getImageUrlAsync = async (path: string, size: string = 'w92') => {
  const cacheKey = `${path}-${size}`
  if (imageUrlCache.value.has(cacheKey)) {
    return imageUrlCache.value.get(cacheKey)!
  }
  
  try {
    const url = await getImageUrl(path, size as any)
    imageUrlCache.value.set(cacheKey, url)
    return url
  } catch (error) {
    console.error('获取图片URL失败:', error)
    return ''
  }
}

// 为搜索结果添加图片URL
const addImageUrlsToResults = async (results: any[]) => {
  for (const item of results) {
    if (item.poster_path) {
      item.posterUrl = await getImageUrlAsync(item.poster_path, 'w92')
    }
    if (item.profile_path) {
      item.profileUrl = await getImageUrlAsync(item.profile_path, 'w92')
    }
  }
}

// 防抖定时器
let searchTimeout: NodeJS.Timeout | null = null

// 关闭模态框
const closeModal = () => {
  emit('update:visible', false)
  searchQuery.value = ''
  movieResults.value = []
  tvResults.value = []
  personResults.value = []
  loading.value = false
}

// 处理搜索（带防抖）
const handleSearch = () => {
  // 清除之前的定时器
  if (searchTimeout) {
    clearTimeout(searchTimeout)
  }
  
  // 设置新的定时器
  searchTimeout = setTimeout(() => {
    performSearch()
  }, 300) // 300ms防抖
}

// 执行搜索
const performSearch = async () => {
  if (!searchQuery.value.trim()) {
    movieResults.value = []
    tvResults.value = []
    personResults.value = []
    return
  }
  
  loading.value = true
  try {
    const results = await searchMulti(searchQuery.value)
    
    // 添加安全检查
    if (!results || !results.results || !Array.isArray(results.results)) {
      console.error('搜索结果格式错误:', results)
      movieResults.value = []
      tvResults.value = []
      personResults.value = []
      return
    }
    
    // 分类结果
    movieResults.value = results.results.filter((item: any) => item.media_type === 'movie').slice(0, 5)
    tvResults.value = results.results.filter((item: any) => item.media_type === 'tv').slice(0, 5)
    personResults.value = results.results.filter((item: any) => item.media_type === 'person').slice(0, 5)

    // 为结果添加图片URL
    await addImageUrlsToResults(movieResults.value)
    await addImageUrlsToResults(tvResults.value)
    await addImageUrlsToResults(personResults.value)
    
    // 添加到搜索历史
    addToRecentSearches(searchQuery.value.trim())

  } catch (error) {
    console.error('搜索失败:', error)
    movieResults.value = []
    tvResults.value = []
    personResults.value = []
  } finally {
    loading.value = false
  }
}

// 跳转到详情页
const goToDetail = (type: string, id: number) => {
  router.push(`/${type}/${id}`)
  closeModal()
}

// 跳转到演员页面
const goToPerson = (id: number) => {
  router.push(`/person/${id}`)
  closeModal()
}

// 添加搜索到历史记录
const addToRecentSearches = (query: string) => {
  if (!query.trim()) return
  
  // 移除重复项
  const filtered = recentSearches.value.filter(item => item !== query)
  // 添加到开头
  filtered.unshift(query)
  // 限制数量
  if (filtered.length > MAX_RECENT_SEARCHES) {
    filtered.splice(MAX_RECENT_SEARCHES)
  }
  recentSearches.value = filtered
  
  // 保存到本地存储
  localStorage.setItem('recentSearches', JSON.stringify(recentSearches.value))
}

// 从历史记录搜索
const searchFromHistory = (query: string) => {
  searchQuery.value = query
  performSearch()
}

// 清空搜索历史
const clearRecentSearches = () => {
  recentSearches.value = []
  localStorage.removeItem('recentSearches')
}

// 加载搜索历史
const loadRecentSearches = () => {
  try {
    const saved = localStorage.getItem('recentSearches')
    if (saved) {
      recentSearches.value = JSON.parse(saved)
    }
  } catch (error) {
    console.error('加载搜索历史失败:', error)
  }
}

// 监听模态框显示状态
watch(() => props.visible, (visible) => {
  if (visible) {
    nextTick(() => {
      searchInput.value?.focus()
      loadRecentSearches()
    })
  }
})
</script> 