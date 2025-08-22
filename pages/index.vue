<script setup lang="ts">
import type { TMDBMovie, TMDBSeries, TMDBGenre } from '../types'
import { ref, onMounted, computed, watch, onUnmounted } from 'vue'
import { t } from '../composables/useI18n'
import TrendingCarousel from '../components/TrendingCarousel.vue'
import MediaList from '../components/MediaList.vue'
import ResponsiveGrid from '../components/ResponsiveGrid.vue'

// 页面元数据
useHead({
  title: t('home') + ' - MoviCloud',
  meta: [
    { name: 'description', content: t('welcome_to_movicloud') }
  ]
})

// 获取TMDB服务
const { 
  getPopularMovies, 
  getTopRatedMovies, 
  getPopularTVShows, 
  getTopRatedTVShows,
  getMovieGenres,
  getTVGenres,
  getTrendingToday
} = useTMDBClient()

// 响应式数据
const popularMovies = ref<TMDBMovie[]>([])
const topRatedMovies = ref<TMDBMovie[]>([])
const popularTVShows = ref<TMDBSeries[]>([])
const topRatedTVShows = ref<TMDBSeries[]>([])
const movieGenres = ref<TMDBGenre[]>([])
const tvGenres = ref<TMDBGenre[]>([])
const trendingList = ref<any[]>([])

// 加载状态
const loading = ref(true)
const error = ref('')

// 获取所有数据
const fetchAllData = async () => {
  try {
    loading.value = true
    error.value = ''
    
    // 并行获取所有数据
    const [
      trendingData,
      popularMoviesData,
      topRatedMoviesData,
      popularTVShowsData,
      topRatedTVShowsData,
      movieGenresData,
      tvGenresData
    ] = await Promise.all([
      getTrendingToday(),
      getPopularMovies(1),
      getTopRatedMovies(1),
      getPopularTVShows(1),
      getTopRatedTVShows(1),
      getMovieGenres(),
      getTVGenres()
    ])
    
    // 先设置基础数据，让页面快速显示
    popularMovies.value = popularMoviesData.results
    topRatedMovies.value = topRatedMoviesData.results
    popularTVShows.value = popularTVShowsData.results
    topRatedTVShows.value = topRatedTVShowsData.results
    movieGenres.value = movieGenresData.genres
    tvGenres.value = tvGenresData.genres
    
    // 设置轮播图数据（不包含logo）
    trendingList.value = trendingData.results
    
    // 异步获取轮播图logo信息（不阻塞页面显示）
    const { getMovieImages, getTVShowImages } = useTMDBClient()
    const logoPromises = trendingList.value.map(async (item, index) => {
      try {
        if (item.media_type === 'movie') {
          const images = await getMovieImages(item.id)
          return { ...item, logos: { logos: images.logos }, originalIndex: index }
        } else {
          const images = await getTVShowImages(item.id)
          return { ...item, logos: { logos: images.logos }, originalIndex: index }
        }
      } catch (err) {
        return { ...item, originalIndex: index }
      }
    })
    
    // 异步更新轮播图logo，保持原有顺序
    Promise.all(logoPromises).then(itemsWithLogos => {
      // 按原始索引排序，保持原有顺序
      const sortedItems = itemsWithLogos.sort((a, b) => a.originalIndex - b.originalIndex)
      // 移除临时索引，保持数据结构一致
      trendingList.value = sortedItems.map(item => {
        const { originalIndex, ...rest } = item
        return rest
      })
    })
    
    // 异步获取额外数据（如果需要）
    const maxCount = Math.max(24, visibleCount.value)
    
    const additionalDataPromises = []
    
    if (popularMoviesData.results.length < maxCount) {
      additionalDataPromises.push(
        getPopularMovies(2).then(page2Data => {
          popularMovies.value = [...popularMoviesData.results, ...page2Data.results]
        })
      )
    }
    
    if (topRatedMoviesData.results.length < maxCount) {
      additionalDataPromises.push(
        getTopRatedMovies(2).then(page2Data => {
          topRatedMovies.value = [...topRatedMoviesData.results, ...page2Data.results]
        })
      )
    }
    
    if (popularTVShowsData.results.length < maxCount) {
      additionalDataPromises.push(
        getPopularTVShows(2).then(page2Data => {
          popularTVShows.value = [...popularTVShowsData.results, ...page2Data.results]
        })
      )
    }
    
    if (topRatedTVShowsData.results.length < maxCount) {
      additionalDataPromises.push(
        getTopRatedTVShows(2).then(page2Data => {
          topRatedTVShows.value = [...topRatedTVShowsData.results, ...page2Data.results]
        })
      )
    }
    
    // 异步获取额外数据（不阻塞页面显示）
    Promise.all(additionalDataPromises).catch(err => {
      console.error('获取额外数据失败:', err)
    })
    
  } catch (err) {
    error.value = '获取数据失败，请稍后重试'
  } finally {
    loading.value = false
  }
}

// 根据屏幕宽度计算每行显示的卡片数量，只显示两行
const visibleCount = ref(4) // 默认显示4个

const updateVisibleCount = () => {
  const screenWidth = window.innerWidth
  
  // 根据屏幕宽度计算每行卡片数量
  let cardsPerRow = 2 // 默认每行2个
  
  if (screenWidth >= 1920) { // 3xl及以上（超宽屏）
    cardsPerRow = 12
  } else if (screenWidth >= 1600) { // 4xl（超宽屏）
    cardsPerRow = 9
  } else if (screenWidth >= 1536) { // 2xl（大屏）
    cardsPerRow = 9
  } else if (screenWidth >= 1280) { // xl
    cardsPerRow = 7
  } else if (screenWidth >= 1024) { // lg
    cardsPerRow = 5
  } else if (screenWidth >= 768) { // md
    cardsPerRow = 4
  } else if (screenWidth >= 640) { // sm
    cardsPerRow = 3
  } else { // xs
    cardsPerRow = 2
  }
  
  // 只显示两行
  visibleCount.value = cardsPerRow * 2
}

// 监听visibleCount变化，重新获取数据
watch(visibleCount, () => {
  if (!loading.value) {
    fetchAllData()
  }
})

// 页面加载时获取数据
onMounted(() => {
  // 初始化显示数量
  updateVisibleCount()
  
  fetchAllData()
  
  // 监听窗口大小变化
  window.addEventListener('resize', updateVisibleCount)
})

onUnmounted(() => {
  window.removeEventListener('resize', updateVisibleCount)
})

// 处理查看更多
const handleViewMore = (type: string) => {
  // 跳转到对应的页面
  navigateTo(`/${type}`)
}

// 计算骨架屏项目数量（与visibleCount保持一致）
const skeletonItemCount = computed(() => {
  return visibleCount.value
})

onMounted(() => {
  // 初始化显示数量
  updateVisibleCount()
  
  fetchAllData()
  
  // 监听窗口大小变化
  window.addEventListener('resize', updateVisibleCount)
})

onUnmounted(() => {
  window.removeEventListener('resize', updateVisibleCount)
})
</script>



<template>
  <div class="bg-surface-50 dark:bg-surface-950 min-h-screen">
    <!-- 轮播图区域 -->
    <TrendingCarousel v-if="!loading && trendingList.length > 0" :items="trendingList" />
    
    <!-- 轮播图骨架屏 -->
    <div v-if="loading" class="relative w-full h-[500px] 2xl:h-[700px] overflow-hidden">
      <!-- 背景骨架 -->
      <div class="w-full h-full bg-surface-200 dark:bg-surface-700 animate-pulse"></div>
      
      <!-- Logo骨架 -->
      <div class="absolute top-8 left-8 w-120 h-16 bg-surface-300 dark:bg-surface-600 rounded animate-pulse"></div>
      
      <!-- 内容区域骨架 -->
      <div class="absolute left-0 bottom-0 p-8 max-w-2xl">
        <!-- 标题骨架 -->
        <div class="h-12 bg-surface-300 dark:bg-surface-600 rounded mb-4 animate-pulse"></div>
        <div class="h-8 bg-surface-300 dark:bg-surface-600 rounded mb-4 animate-pulse w-3/4"></div>
        
        <!-- 描述骨架 -->
        <div class="space-y-2">
          <div class="h-4 bg-surface-300 dark:bg-surface-600 rounded animate-pulse"></div>
          <div class="h-4 bg-surface-300 dark:bg-surface-600 rounded animate-pulse w-5/6"></div>
          <div class="h-4 bg-surface-300 dark:bg-surface-600 rounded animate-pulse w-4/6"></div>
        </div>
      </div>
      
      <!-- 指示点骨架 -->
      <div class="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-3">
        <div class="w-3 h-3 rounded-full bg-surface-300 dark:bg-surface-600 animate-pulse"></div>
        <div class="w-3 h-3 rounded-full bg-surface-300 dark:bg-surface-600 animate-pulse"></div>
        <div class="w-3 h-3 rounded-full bg-surface-300 dark:bg-surface-600 animate-pulse"></div>
        <div class="w-3 h-3 rounded-full bg-surface-300 dark:bg-surface-600 animate-pulse"></div>
        <div class="w-3 h-3 rounded-full bg-surface-300 dark:bg-surface-600 animate-pulse"></div>
      </div>
    </div>
    
    <div class="px-6 pb-6 space-y-8 mt-8">
      <!-- 错误状态 -->
      <div v-if="error" class="text-center py-8">
        <i class="pi pi-exclamation-triangle text-4xl text-red-500 mb-4"></i>
        <p class="text-surface-600 dark:text-surface-400">{{ error }}</p>
        <button 
          @click="fetchAllData"
          class="mt-4 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-600 transition-colors duration-200"
        >
          {{ t('retry') }}
        </button>
    </div>
    
      <!-- 热门电影 -->
      <MediaList
        v-if="!loading && !error"
        :title="t('popular_movies')"
        type="movie"
        :media-list="popularMovies.slice(0, visibleCount)"
        :loading="loading"
        :genres="movieGenres"
        :show-view-more="true"
        @view-more="handleViewMore('movies')"
      />
      
      <!-- 高分电影 -->
      <MediaList
        v-if="!loading && !error"
        :title="t('top_rated_movies')"
        type="movie"
        :media-list="topRatedMovies.slice(0, visibleCount)"
        :loading="loading"
        :genres="movieGenres"
        :show-view-more="true"
        @view-more="handleViewMore('movies')"
      />
      
      <!-- 热门电视剧 -->
      <MediaList
        v-if="!loading && !error"
        :title="t('popular_tv_shows')"
        type="tv"
        :media-list="popularTVShows.slice(0, visibleCount)"
        :loading="loading"
        :genres="tvGenres"
        :show-view-more="true"
        @view-more="handleViewMore('tv')"
      />
      
      <!-- 高分电视剧 -->
      <MediaList
        v-if="!loading && !error"
        :title="t('top_rated_tv_shows')"
        type="tv"
        :media-list="topRatedTVShows.slice(0, visibleCount)"
        :loading="loading"
        :genres="tvGenres"
        :show-view-more="true"
        @view-more="handleViewMore('tv')"
      />
      
      <!-- 加载状态 -->
      <div v-if="loading" class="space-y-8">
        <div class="space-y-6">
          <div class="flex items-center justify-between">
            <div class="h-8 w-48 bg-surface-200 dark:bg-surface-700 rounded animate-pulse"></div>
            <div class="h-6 w-20 bg-surface-200 dark:bg-surface-700 rounded animate-pulse"></div>
          </div>
          <ResponsiveGrid class="responsive-grid">
            <div 
              v-for="i in skeletonItemCount" 
              :key="i"
              class="aspect-[2/3] bg-surface-200 dark:bg-surface-700 rounded-lg animate-pulse"
            ></div>
          </ResponsiveGrid>
        </div>
        
        <div class="space-y-6">
          <div class="flex items-center justify-between">
            <div class="h-8 w-48 bg-surface-200 dark:bg-surface-700 rounded animate-pulse"></div>
            <div class="h-6 w-20 bg-surface-200 dark:bg-surface-700 rounded animate-pulse"></div>
          </div>
          <ResponsiveGrid class="responsive-grid">
            <div 
              v-for="i in skeletonItemCount" 
              :key="i"
              class="aspect-[2/3] bg-surface-200 dark:bg-surface-700 rounded-lg animate-pulse"
            ></div>
          </ResponsiveGrid>
        </div>
      </div>
    </div>
  </div>
</template>