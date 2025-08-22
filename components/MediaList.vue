<template>
  <div class="space-y-6">
    <!-- 标题和查看更多 -->
    <div class="flex items-center justify-between">
      <h2 class="text-2xl font-bold text-surface-900 dark:text-surface-0">{{ title }}</h2>
      <button 
        v-if="showViewMore"
        @click="handleViewMore"
        class="text-primary hover:text-primary-600 dark:hover:text-primary-400 transition-colors duration-200 flex items-center gap-2"
      >
        <span>{{ t('view_more') }}</span>
        <i class="pi pi-arrow-right text-sm"></i>
      </button>
    </div>
    
    <!-- 加载状态 -->
    <div v-if="loading" class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
      <div 
        v-for="i in 6" 
        :key="i"
        class="aspect-[2/3] bg-surface-200 dark:bg-surface-700 rounded-lg animate-pulse"
      ></div>
    </div>
    
    <!-- 影视列表 -->
    <ResponsiveGrid v-else class="responsive-grid">
      <MediaCard
        v-for="item in mediaList"
        :key="item.id"
        :id="item.id"
        :title="getTitle(item)"
        :poster-path="item.poster_path"
        :rating="item.vote_average"
        :vote-count="item.vote_count"
        :genres="getGenres(item.genre_ids)"
        :country="getCountry(item.original_language)"
        :year="getYear(item)"
        :cast="getCast(item)"
        :type="type"
        @click="handleCardClick"
      />
    </ResponsiveGrid>
    
    <!-- 错误状态 -->
    <div v-if="error" class="text-center py-8">
      <i class="pi pi-exclamation-triangle text-4xl text-red-500 mb-4"></i>
      <p class="text-surface-600 dark:text-surface-400">{{ error }}</p>
      <button 
        @click="retry"
        class="mt-4 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-600 transition-colors duration-200"
      >
        {{ t('retry') }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { TMDBMovie, TMDBSeries, TMDBGenre } from '../types'
import { t } from '../composables/useI18n'
import { useCountryTranslation } from '../composables/useCountryTranslation'

interface Props {
  title: string
  type: 'movie' | 'tv'
  mediaList: (TMDBMovie | TMDBSeries)[]
  loading: boolean
  error?: string
  showViewMore?: boolean
  genres: TMDBGenre[]
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'view-more': []
  'card-click': [id: number, type: 'movie' | 'tv']
}>()

const router = useRouter()
const { getCountryName } = useCountryTranslation()

// 类型名称翻译映射
const genreNameMap: Record<string, string> = {
  'Action': 'action',
  'Adventure': 'adventure',
  'Animation': 'animation',
  'Comedy': 'comedy',
  'Crime': 'crime',
  'Documentary': 'documentary',
  'Drama': 'drama',
  'Family': 'family',
  'Fantasy': 'fantasy',
  'History': 'history',
  'Horror': 'horror',
  'Music': 'music',
  'Mystery': 'mystery',
  'Romance': 'romance',
  'Science Fiction': 'science_fiction',
  'TV Movie': 'tv_movie',
  'Thriller': 'thriller',
  'War': 'war',
  'Western': 'western'
}

const getTitle = (item: TMDBMovie | TMDBSeries) => {
  if ('title' in item) {
    return item.title
  }
  return item.name
}

const getYear = (item: TMDBMovie | TMDBSeries) => {
  if ('release_date' in item) {
    return item.release_date.split('-')[0]
  }
  return item.first_air_date.split('-')[0]
}

const getGenres = (genreIds: number[]) => {
  return props.genres
    .filter(genre => genreIds.includes(genre.id))
    .map(genre => {
      // 尝试翻译类型名称
      const translationKey = genreNameMap[genre.name]
      return translationKey ? t(translationKey) : genre.name
    })
    .slice(0, 3) // 只显示前3个类型
}

const getCountry = (language: string) => {
  return getCountryName(language)
}

const getCast = (item: TMDBMovie | TMDBSeries) => {
  // 这里可以从item中获取主演信息，如果有的话
  // 暂时返回空数组，实际使用时可以从API获取
  return []
}

const handleViewMore = () => {
  emit('view-more')
}

const handleCardClick = (id: number, type: 'movie' | 'tv') => {
  emit('card-click', id, type)
  // 跳转到详情页
  router.push(`/${type}/${id}`)
}

const retry = () => {
  // 触发重新加载
  emit('view-more')
}
</script> 

 