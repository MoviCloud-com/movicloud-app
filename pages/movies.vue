<script setup lang="ts">
import type { TMDBMovie, TMDBGenre } from '../composables/useTMDBClient'
import { ref, onMounted, computed } from 'vue'
import { t } from '../composables/useI18n'
import MediaCard from '../components/MediaCard.vue'
import ResponsiveGrid from '../components/ResponsiveGrid.vue'

// 页面元数据
useHead({
  title: t('movies') + ' - MoviCloud',
  meta: [
    { name: 'description', content: t('movies') + ' - ' + t('welcome_to_movicloud') }
  ]
})

// 状态
const movies = ref<TMDBMovie[]>([])
const movieGenres = ref<TMDBGenre[]>([])
const loading = ref(true)
const loadingMore = ref(false)
const error = ref('')
const currentPage = ref(1)
const hasMore = ref(true)

// 筛选状态
const currentFilters = ref({
  sort: 'popularity.desc',
  genres: [] as number[],
  languages: [] as string[],
  minRating: 0
})

// 获取TMDB API函数
const { getFilteredMovies, getMovieGenres } = useTMDBClient()

// 获取电影数据
const fetchMovies = async (isLoadMore = false) => {
  try {
    if (isLoadMore) {
      loadingMore.value = true
    } else {
      loading.value = true
    }
    error.value = ''
    
    const response = await getFilteredMovies({
      ...currentFilters.value,
      page: currentPage.value
    })
    
    if (isLoadMore) {
      movies.value.push(...response.results)
    } else {
      movies.value = response.results
    }
    
    // 检查是否还有更多数据
    hasMore.value = currentPage.value < Math.min(response.total_pages, 500)
  } catch (err) {
    error.value = '获取电影数据失败，请稍后重试'
  } finally {
    loading.value = false
    loadingMore.value = false
  }
}

// 获取电影类型
const fetchGenres = async () => {
  try {
    const response = await getMovieGenres()
    movieGenres.value = response.genres
  } catch (err) {
    console.error('获取电影类型失败:', err)
  }
}

// 处理筛选变化
const handleFilterChange = (filters: any) => {
  currentFilters.value = filters
  currentPage.value = 1 // 重置到第一页
  hasMore.value = true
  fetchMovies()
}

// 加载更多
const loadMore = async () => {
  if (loadingMore.value || !hasMore.value) return
  
  currentPage.value++
  await fetchMovies(true)
}

// 监听滚动到底部
const handleScroll = () => {
  const scrollTop = window.pageYOffset || document.documentElement.scrollTop
  const windowHeight = window.innerHeight
  const documentHeight = document.documentElement.scrollHeight
  
  // 当滚动到距离底部100px时加载更多
  if (scrollTop + windowHeight >= documentHeight - 100) {
    loadMore()
  }
  
  // 如果页面高度小于等于窗口高度，且还有更多数据，直接加载
  if (documentHeight <= windowHeight && hasMore.value && !loadingMore.value) {
    loadMore()
  }
}

// 页面加载时获取数据
onMounted(async () => {
  await Promise.all([
    fetchGenres(),
    fetchMovies()
  ])
  
  // 添加滚动监听
  window.addEventListener('scroll', handleScroll)
  
  // 初始检查是否需要加载更多
  nextTick(() => {
    handleScroll()
  })
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
})
</script>

<template>
  <div class="bg-surface-50 dark:bg-surface-950">
    <div class="relative h-48 bg-gradient-to-b from-primary-500 to-transparent">
      <!-- 背景装饰 -->
      <div class="absolute inset-0"></div>
      
      <!-- 内容 -->
      <div class="relative h-full flex items-center justify-center">
        <div class="text-center text-white">
          <h1 class="text-5xl font-bold mb-4">{{ t('movie_library') }}</h1>
          <p class="text-xl opacity-90">{{ t('discover_latest_and_popular_movies') }}</p>
        </div>
      </div>
      
      <!-- 底部渐变 -->
      <div class="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-b from-transparent to-surface-50 dark:to-surface-950"></div>
    </div>

    <div class="p-6">
      <!-- 筛选区域 -->
      <MediaFilter
        type="movie"
        :genres="movieGenres"
        @filter-change="handleFilterChange"
      />

      <!-- 主要内容区域 -->
      <div>
        <!-- 加载状态 -->
        <div v-if="loading && movies.length === 0" class="mt-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-4">
          <div 
            v-for="i in 12" 
            :key="i"
            class="aspect-[2/3] bg-surface-200 dark:bg-surface-700 rounded-lg animate-pulse"
          ></div>
        </div>

        <!-- 错误状态 -->
        <div v-else-if="error && movies.length === 0" class="text-center py-8">
          <i class="pi pi-exclamation-triangle text-4xl text-red-500 mb-4"></i>
          <p class="text-surface-600 dark:text-surface-400">{{ error }}</p>
          <button 
            @click="() => fetchMovies()"
            class="mt-4 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-600 transition-colors duration-200"
          >
            {{ t('retry') }}
          </button>
        </div>

        <!-- 电影列表 -->
        <div v-else>
          <MediaList
            title=""
            type="movie"
            :media-list="movies"
            :loading="false"
            :genres="movieGenres"
            :show-view-more="false"
          />

          <!-- 加载更多状态 -->
          <div v-if="loadingMore" class="mt-8 text-center">
            <div class="inline-flex items-center gap-2 text-surface-600 dark:text-surface-400">
              <i class="pi pi-spin pi-spinner"></i>
              <span>{{ t('loading_more') }}...</span>
            </div>
          </div>

          <!-- 没有更多数据 -->
          <div v-else-if="!hasMore" class="mt-8 text-center">
            <p class="text-surface-600 dark:text-surface-400">{{ t('no_more_data') }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>