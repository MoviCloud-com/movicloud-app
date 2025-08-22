<template>
  <div class="min-h-screen">
    <!-- 加载状态 -->
    <div v-if="loading" class="min-h-screen flex items-center justify-center">
      <div class="text-center">
        <i class="pi pi-spin pi-spinner text-4xl text-primary-500 mb-4"></i>
        <p class="text-surface-600 dark:text-surface-400">{{ t('loading_actor_info') }}</p>
      </div>
    </div>
    
    <!-- 错误状态 -->
    <div v-else-if="error" class="min-h-screen flex items-center justify-center">
      <div class="text-center">
        <i class="pi pi-exclamation-triangle text-4xl text-red-500 mb-4"></i>
        <p class="text-surface-600 dark:text-surface-400">{{ error }}</p>
        <button 
          @click="fetchPersonDetails"
          class="mt-4 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
        >
          {{ t('retry') }}
        </button>
      </div>
    </div>
    
    <!-- 主要内容 -->
    <div v-else class="min-h-screen">
      <!-- 头部背景图 -->
      <div class="relative h-96 md:h-[500px] overflow-hidden">
        <img
          v-if="personDetails?.profile_path"
          :src="backdropImageUrl || ''"
          class="w-full h-full object-cover"
          :alt="personDetails?.name"
        />
        <div v-else class="w-full h-full bg-gradient-to-br from-primary-500 to-primary-700"></div>
        
        <!-- 渐变遮罩 -->
        <div class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent"></div>
        
        <!-- 内容 -->
        <div class="absolute bottom-0 left-0 right-0 p-6 md:p-8">
          <div class="flex flex-col md:flex-row gap-6 md:gap-8 items-end md:items-end">
            <!-- 头像 -->
            <div class="relative">
              <img
                v-if="personDetails?.profile_path"
                :src="profileImageUrl || ''"
                :alt="personDetails?.name"
                class="w-32 h-48 md:w-40 md:h-60 object-cover rounded-lg shadow-2xl"
              />
              <div v-else class="w-32 h-48 md:w-40 md:h-60 bg-surface-300 dark:bg-surface-600 rounded-lg shadow-2xl flex items-center justify-center">
                <UserAvatar class="w-16 h-16" />
              </div>
            </div>
            
            <!-- 基本信息 -->
            <div class="flex-1 text-white">
              <h1 class="text-3xl md:text-5xl font-bold mb-4">{{ personDetails?.name }}</h1>
              <div class="flex flex-wrap gap-4 text-sm md:text-base mb-4">
                <span v-if="personDetails?.birthday" class="flex items-center gap-2">
                  <i class="pi pi-calendar"></i>
                  {{ formatDate(personDetails.birthday) }}
                  <span v-if="personDetails?.deathday"> - {{ formatDate(personDetails.deathday) }}</span>
                </span>
                <span v-if="personDetails?.place_of_birth" class="flex items-center gap-2">
                  <i class="pi pi-map-marker"></i>
                  {{ translatePlaceOfBirth(personDetails.place_of_birth) }}
                </span>
                <span v-if="personDetails?.known_for_department" class="flex items-center gap-2">
                  <i class="pi pi-briefcase"></i>
                  {{ translateDepartment(personDetails.known_for_department) }}
                </span>
              </div>
              
              <!-- 简介预览 -->
              <div v-if="personDetails?.biography" class="max-w-2xl">
                <p class="text-surface-200 text-sm md:text-base line-clamp-3">
                  {{ personDetails.biography }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 主要内容 -->
      <div class="mx-auto px-4 py-4">
        <!-- 选项卡切换 -->
        <div class="mb-8">
          <div class="flex border-b border-surface-200 dark:border-surface-700">
            <button
              @click="activeTab = 'movies'"
              :class="[
                'px-6 py-3 text-lg font-medium transition-colors',
                activeTab === 'movies'
                  ? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-600 dark:border-primary-400'
                  : 'text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-surface-100'
              ]"
            >
              {{ t('movie_works') }} ({{ movieCredits?.cast?.length || 0 }})
            </button>
            <button
              @click="activeTab = 'tv'"
              :class="[
                'px-6 py-3 text-lg font-medium transition-colors',
                activeTab === 'tv'
                  ? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-600 dark:border-primary-400'
                  : 'text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-surface-100'
              ]"
            >
              {{ t('tv_works') }} ({{ tvCredits?.cast?.length || 0 }})
            </button>
          </div>
        </div>
        
        <!-- 作品列表 -->
        <div class="mb-8">
          <!-- 电影作品 -->
          <div v-if="activeTab === 'movies' && movieCredits?.cast?.length">
            <div class="grid gap-4" :class="gridClasses">
              <MediaCard
                v-for="movie in movieCredits.cast"
                :key="movie.id"
                :id="movie.id"
                :title="getTitle(movie)"
                :poster-path="movie.poster_path"
                :rating="movie.vote_average"
                :vote-count="movie.vote_count"
                :genres="getGenres(movie.genre_ids || [], true)"
                :country="getCountry(movie.original_language)"
                :year="getYear(movie)"
                :cast="movie.character ? [movie.character] : []"
                :type="'movie'"
                @click="goToDetail(movie.id, 'movie')"
              />
            </div>
          </div>
          
          <!-- 电视剧作品 -->
          <div v-if="activeTab === 'tv' && tvCredits?.cast?.length">
            <div class="grid gap-4" :class="gridClasses">
              <MediaCard
                v-for="tv in tvCredits.cast"
                :key="tv.id"
                :id="tv.id"
                :title="getTitle(tv)"
                :poster-path="tv.poster_path"
                :rating="tv.vote_average"
                :vote-count="tv.vote_count"
                :genres="getGenres(tv.genre_ids || [], false)"
                :country="getCountry(tv.original_language)"
                :year="getYear(tv)"
                :cast="tv.character ? [tv.character] : []"
                :type="'tv'"
                @click="goToDetail(tv.id, 'tv')"
              />
            </div>
          </div>
          
          <!-- 空状态 -->
          <div v-if="(activeTab === 'movies' && (!movieCredits?.cast?.length || movieCredits.cast.length === 0)) || 
                      (activeTab === 'tv' && (!tvCredits?.cast?.length || tvCredits.cast.length === 0))" 
               class="text-center py-12">
            <i class="pi pi-film text-4xl text-surface-300 dark:text-surface-600 mb-4"></i>
            <p class="text-surface-600 dark:text-surface-400">{{ activeTab === 'movies' ? t('no_movie_works') : t('no_tv_works') }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRoute, useRouter } from 'vue-router'
import { useTMDBClient } from '../../composables/useTMDBClient'
import MediaCard from '../../components/MediaCard.vue'
import { ref, onMounted, watch } from 'vue'
import { t } from '../../composables/useI18n'
import { useCountryTranslation } from '../../composables/useCountryTranslation'

const route = useRoute()
const router = useRouter()
const { getImageUrl, getBackdropUrl, getPersonDetails, getPersonMovieCredits, getPersonTVCredits, getMovieGenres, getTVGenres } = useTMDBClient()

const personId = parseInt(route.params.id as string)

// 响应式数据
const personDetails = ref<any>(null)
const movieCredits = ref<any>(null)
const tvCredits = ref<any>(null)
const movieGenres = ref<any[]>([])
const tvGenres = ref<any[]>([])
const loading = ref(true)
const error = ref('')

// 图片URL
const profileImageUrl = ref('')
const backdropImageUrl = ref('')

// 异步加载图片URL
const loadImageUrls = async () => {
  if (personDetails.value?.profile_path) {
    profileImageUrl.value = await getImageUrl(personDetails.value.profile_path, 'w342')
    backdropImageUrl.value = await getBackdropUrl(personDetails.value.profile_path, 'w1280')
  }
}

// 监听人物详情变化
watch(() => personDetails.value, () => {
  loadImageUrls()
}, { deep: true })

// 组件挂载时加载图片URL
onMounted(() => {
  loadImageUrls()
})

// 选项卡状态
const activeTab = ref('movies')

// 获取网格类
const getGridClasses = () => {
  // 根据屏幕宽度动态计算网格类，与movies和tv页面保持一致
  const screenWidth = window.innerWidth
  
  if (screenWidth >= 1920) { // 3xl及以上（超宽屏）
    return 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7 2xl:grid-cols-9 4xl:grid-cols-9 3xl:grid-cols-12'
  } else if (screenWidth >= 1600) { // 4xl（超宽屏）
    return 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7 2xl:grid-cols-9 4xl:grid-cols-9'
  } else if (screenWidth >= 1536) { // 2xl（大屏）
    return 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7 2xl:grid-cols-9'
  } else if (screenWidth >= 1280) { // xl
    return 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7'
  } else if (screenWidth >= 1024) { // lg
    return 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5'
  } else if (screenWidth >= 768) { // md
    return 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4'
  } else if (screenWidth >= 640) { // sm
    return 'grid-cols-2 sm:grid-cols-3'
  } else { // xs
    return 'grid-cols-2'
  }
}

// 网格布局类
const gridClasses = ref(getGridClasses())

// 更新网格类
const updateGridClasses = () => {
  gridClasses.value = getGridClasses()
}

// 获取演员详情
const fetchPersonDetails = async () => {
  try {
    loading.value = true
    error.value = ''
    
    const [details, movieCreditsData, tvCreditsData, movieGenresData, tvGenresData] = await Promise.all([
      getPersonDetails(personId),
      getPersonMovieCredits(personId),
      getPersonTVCredits(personId),
      getMovieGenres(),
      getTVGenres()
    ])
    
    personDetails.value = details
    movieCredits.value = movieCreditsData
    tvCredits.value = tvCreditsData
    movieGenres.value = movieGenresData.genres
    tvGenres.value = tvGenresData.genres
    
  } catch (err) {
    error.value = t('failed_to_get_actor_info')
  } finally {
    loading.value = false
  }
}

// 格式化日期
const formatDate = (dateString: string) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  
  // 根据当前语言设置日期格式
  const currentLang = getCurrentLanguage()
  let locale = 'zh-CN'
  
  if (currentLang === 'en-US') {
    locale = 'en-US'
  } else if (currentLang === 'zh-TW') {
    locale = 'zh-TW'
  }
  
  return date.toLocaleDateString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

// 获取标题
const getTitle = (item: any) => {
  return item.title || item.name
}

// 获取年份
const getYear = (item: any) => {
  if (item.release_date) {
    return item.release_date.split('-')[0]
  }
  if (item.first_air_date) {
    return item.first_air_date.split('-')[0]
  }
  return ''
}

// 获取类型
const getGenres = (genreIds: number[], isMovie: boolean) => {
  const genres = isMovie ? movieGenres.value : tvGenres.value
  return genres
    .filter((genre: any) => genreIds.includes(genre.id))
    .map((genre: any) => genre.name)
    .slice(0, 3) // 只显示前3个类型
}

// 获取国家
const { getCountryName } = useCountryTranslation()
const getCountry = (language: string) => {
  return getCountryName(language)
}

// 翻译出生地
const translatePlaceOfBirth = (place: string) => {
  // 只翻译国家或地区，去掉城市名
  const countryMap: Record<string, string> = {
    'USA': t('country_usa'),
    'UK': t('country_uk'),
    'France': t('country_france'),
    'Japan': t('country_japan'),
    'South Korea': t('country_korea'),
    'India': t('country_india'),
    'Canada': t('country_canada'),
    'Australia': t('country_australia'),
    'Germany': t('country_germany'),
    'Spain': t('country_spain'),
    'Italy': t('country_italy'),
    'Russia': t('country_russia'),
    'China': t('country_china'),
    'Taiwan': t('country_taiwan'),
    'Hong Kong': t('country_hong_kong'),
    'Singapore': t('country_singapore'),
    'Thailand': t('country_thailand'),
    'Indonesia': t('country_indonesia'),
    'Brazil': t('country_brazil'),
    'Mexico': t('country_mexico'),
    'Argentina': t('country_argentina'),
    'Netherlands': t('country_netherlands'),
    'Sweden': t('country_sweden'),
    'Norway': t('country_norway'),
    'Denmark': t('country_denmark'),
    'Finland': t('country_finland'),
    'Switzerland': t('country_switzerland'),
    'Austria': t('country_austria'),
    'Belgium': t('country_belgium'),
    'Portugal': t('country_portugal'),
    'Greece': t('country_greece'),
    'Poland': t('country_poland'),
    'Czech Republic': t('country_czech'),
    'Hungary': t('country_hungary'),
    'Romania': t('country_romania'),
    'Bulgaria': t('country_bulgaria'),
    'Croatia': t('country_croatia'),
    'Serbia': t('country_serbia'),
    'Slovenia': t('country_slovenia'),
    'Slovakia': t('country_slovakia'),
    'Estonia': t('country_estonia'),
    'Latvia': t('country_latvia'),
    'Lithuania': t('country_lithuania')
  }
  
  // 如果包含国家名，只返回国家名
  for (const [english, chinese] of Object.entries(countryMap)) {
    if (place.includes(english)) {
      return chinese
    }
  }
  
  // 如果没有匹配，返回原文
  return place
}

// 翻译职业部门
const translateDepartment = (department: string) => {
  const departmentMap: Record<string, string> = {
    'Acting': t('department_acting'),
    'Directing': t('department_directing'),
    'Production': t('department_production'),
    'Writing': t('department_writing'),
    'Sound': t('department_sound'),
    'Camera': t('department_camera'),
    'Editing': t('department_editing'),
    'Art': t('department_art'),
    'Costume & Make-Up': t('department_costume_makeup'),
    'Visual Effects': t('department_visual_effects'),
    'Creator': t('department_creator')
  }
  
  return departmentMap[department] || department
}

// 跳转到详情页
const goToDetail = (id: number, type: 'movie' | 'tv') => {
  router.push(`/${type}/${id}`)
}

// 页面加载时获取数据
onMounted(() => {
  fetchPersonDetails()
  
  // 监听窗口大小变化
  window.addEventListener('resize', updateGridClasses)
})

onUnmounted(() => {
  window.removeEventListener('resize', updateGridClasses)
})

// 设置页面标题
useHead({
  title: computed(() => personDetails.value?.name ? `${personDetails.value.name} - MoviCloud` : t('actor_details') + ' - MoviCloud'),
  meta: [
    {
      name: 'description',
      content: computed(() => personDetails.value?.biography ? personDetails.value.biography.slice(0, 160) : '')
    }
  ]
})
</script>

<style scoped>
/* 自定义网格列数 - 覆盖Tailwind的默认行为 */
@media (min-width: 1280px) and (max-width: 1535px) {
  .grid {
    grid-template-columns: repeat(7, minmax(0, 1fr)) !important;
  }
}

@media (min-width: 1536px) and (max-width: 1599px) {
  .grid {
    grid-template-columns: repeat(9, minmax(0, 1fr)) !important;
  }
}

@media (min-width: 1600px) and (max-width: 1919px) {
  .grid {
    grid-template-columns: repeat(9, minmax(0, 1fr)) !important;
  }
}

@media (min-width: 1920px) {
  .grid {
    grid-template-columns: repeat(12, minmax(0, 1fr)) !important;
  }
}

/* 自定义网格列数类 */
@media (min-width: 1280px) {
  .grid-cols-7 {
    grid-template-columns: repeat(7, minmax(0, 1fr)) !important;
  }
}
</style> 