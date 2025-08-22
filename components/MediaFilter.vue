<template>
  <div class="bg-gray-50 dark:bg-surface-800 rounded-lg p-6 shadow-sm">
    <!-- 筛选选项一行显示 -->
    <div class="flex flex-wrap items-center gap-6">
      <!-- 排序 -->
      <div class="flex items-center gap-2">
        <span class="text-base font-medium text-surface-700 dark:text-surface-300 whitespace-nowrap">{{ t('sort') }}</span>
        <div class="flex gap-2">
          <button
            v-for="sort in sortOptions"
            :key="sort.value"
            @click="updateSort(sort.value)"
            :class="[
              'px-3 py-1 rounded-lg text-sm font-medium transition-colors duration-200 cursor-pointer',
              selectedSort === sort.value
                ? 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300'
                : 'bg-surface-100 text-surface-700 dark:bg-surface-700 dark:text-surface-300 hover:bg-surface-200 dark:hover:bg-surface-600'
            ]"
          >
            <i v-if="selectedSort === sort.value" class="pi pi-check mr-1"></i>
            {{ sort.label }}
          </button>
        </div>
      </div>

      <!-- 风格 -->
      <div class="flex items-start gap-2">
        <span class="text-base font-medium text-surface-700 dark:text-surface-300 whitespace-nowrap mt-1">{{ t('genre') }}</span>
        <div class="flex flex-wrap gap-2">
          <button
            v-for="genre in genres"
            :key="genre.id"
            @click="toggleGenre(genre.id)"
            :class="[
              'px-3 py-1 rounded-lg text-sm font-medium transition-colors duration-200 cursor-pointer',
              selectedGenres.includes(genre.id)
                ? 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300'
                : 'bg-surface-100 text-surface-700 dark:bg-surface-700 dark:text-surface-300 hover:bg-surface-200 dark:hover:bg-surface-600'
            ]"
          >
            {{ getGenreName(genre.name) }}
          </button>
        </div>
      </div>

      <!-- 语言 -->
      <div class="flex items-start gap-2">
        <span class="text-base font-medium text-surface-700 dark:text-surface-300 whitespace-nowrap mt-1">{{ t('language') }}</span>
        <div class="flex flex-wrap gap-2">
          <button
            v-for="lang in languageOptions"
            :key="lang.value"
            @click="toggleLanguage(lang.value)"
            :class="[
              'px-3 py-1 rounded-lg text-sm font-medium transition-colors duration-200 cursor-pointer',
              selectedLanguages.includes(lang.value)
                ? 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300'
                : 'bg-surface-100 text-surface-700 dark:bg-surface-700 dark:text-surface-300 hover:bg-surface-200 dark:hover:bg-surface-600'
            ]"
          >
            {{ lang.label }}
          </button>
        </div>
      </div>

      <!-- 评分 -->
      <div class="flex items-center gap-2">
        <span class="text-base font-medium text-surface-700 dark:text-surface-300 whitespace-nowrap">{{ t('rating') }}</span>
        <div class="flex items-center gap-2">
          <input
            v-model="minRating"
            type="range"
            min="0"
            max="10"
            step="0.5"
            class="w-20 h-2 bg-surface-200 dark:bg-surface-600 rounded-lg appearance-none cursor-pointer slider"
            @input="onRatingChange"
          />
          <span class="text-xs font-medium text-surface-700 dark:text-surface-300 w-8">{{ minRating }}</span>
        </div>
      </div>

      <!-- 重置按钮 -->
      <button
        @click="resetFilters"
        class="px-3 py-1 bg-surface-200 dark:bg-surface-700 text-surface-700 dark:text-surface-300 rounded-lg hover:bg-surface-300 dark:hover:bg-surface-600 transition-colors duration-200 text-xs font-medium cursor-pointer"
      >
        {{ t('reset') }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { TMDBGenre } from '../types'
import { t } from '../composables/useI18n'
import { computed } from 'vue'

interface Props {
  type: 'movie' | 'tv'
  genres: TMDBGenre[]
}

const props = defineProps<Props>()

const emit = defineEmits<{
  'filter-change': [filters: FilterOptions]
}>()

interface FilterOptions {
  sort: string
  genres: number[]
  languages: string[]
  minRating: number
}

// 排序选项 - 改为computed属性
const sortOptions = computed(() => [
  { label: t('popularity') + ' ' + t('desc'), value: 'popularity.desc' },
  { label: t('popularity') + ' ' + t('asc'), value: 'popularity.asc' },
  { label: t('latest') + ' ' + t('desc'), value: 'release_date.desc' },
  { label: t('latest') + ' ' + t('asc'), value: 'release_date.asc' },
  { label: t('rating') + ' ' + t('desc'), value: 'vote_average.desc' },
  { label: t('rating') + ' ' + t('asc'), value: 'vote_average.asc' }
])

// 语言选项 - 改为computed属性
const languageOptions = computed(() => [
  { label: t('chinese'), value: 'zh' },
  { label: t('english'), value: 'en' },
  { label: t('japanese'), value: 'ja' },
  { label: t('korean'), value: 'ko' },
  { label: t('french'), value: 'fr' },
  { label: t('german'), value: 'de' },
  { label: t('spanish'), value: 'es' },
  { label: t('italian'), value: 'it' },
  { label: t('russian'), value: 'ru' },
  { label: t('portuguese'), value: 'pt' },
  { label: t('arabic'), value: 'ar' },
  { label: t('hindi'), value: 'hi' },
  { label: t('thai'), value: 'th' }
])

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

// 获取翻译后的类型名称
const getGenreName = (genreName: string) => {
  const translationKey = genreNameMap[genreName]
  return translationKey ? t(translationKey) : genreName
}

// 筛选状态
const selectedSort = ref('popularity.desc')
const selectedGenres = ref<number[]>([])
const selectedLanguages = ref<string[]>([])
const minRating = ref(0)

// 防抖函数
let debounceTimer: NodeJS.Timeout | null = null

const debounceEmit = () => {
  if (debounceTimer) {
    clearTimeout(debounceTimer)
  }
  debounceTimer = setTimeout(() => {
    emitFilters()
  }, 300)
}

// 发出筛选事件
const emitFilters = () => {
  const filters: FilterOptions = {
    sort: selectedSort.value,
    genres: selectedGenres.value,
    languages: selectedLanguages.value,
    minRating: minRating.value
  }
  emit('filter-change', filters)
}

// 更新排序
const updateSort = (sort: string) => {
  selectedSort.value = sort
  debounceEmit()
}

// 切换风格选择
const toggleGenre = (genreId: number) => {
  const index = selectedGenres.value.indexOf(genreId)
  if (index > -1) {
    selectedGenres.value.splice(index, 1)
  } else {
    selectedGenres.value.push(genreId)
  }
  debounceEmit()
}

// 切换语言选择
const toggleLanguage = (language: string) => {
  const index = selectedLanguages.value.indexOf(language)
  if (index > -1) {
    selectedLanguages.value.splice(index, 1)
  } else {
    selectedLanguages.value.push(language)
  }
  debounceEmit()
}

// 评分变化
const onRatingChange = () => {
  debounceEmit()
}

// 重置筛选
const resetFilters = () => {
  selectedSort.value = 'popularity.desc'
  selectedGenres.value = []
  selectedLanguages.value = []
  minRating.value = 0
  emitFilters()
}
</script>

<style scoped>
/* 自定义滑块样式 */
.slider::-webkit-slider-thumb {
  appearance: none;
  height: 20px;
  width: 20px;
  border-radius: 50%;
  background: var(--primary-color);
  cursor: pointer;
}

.slider::-moz-range-thumb {
  height: 20px;
  width: 20px;
  border-radius: 50%;
  background: var(--primary-color);
  cursor: pointer;
  border: none;
}
</style> 