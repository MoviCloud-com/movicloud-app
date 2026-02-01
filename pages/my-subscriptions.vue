<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { t } from '../composables/useI18n'
import { useMoviCloudAPI, type SubscriptionItem } from '../composables/useMoviCloudAPI'
import { useSettingsCache } from '../composables/useSettingsCache'
import { useTMDBClient } from '../composables/useTMDBClient'
import ImageLazy from '../components/ImageLazy.vue'

// 页面元数据
useHead({
  title: `${t('my_subscriptions')} - MoviCloud`,
  meta: [
    { name: 'description', content: t('my_subscriptions_subtitle') }
  ]
})

const { getMySubscriptions, loading: apiLoading } = useMoviCloudAPI()
const { tmdbImageBaseUrl } = useSettingsCache()
const { getMovieDetails, getTVShowDetails } = useTMDBClient()

const subscriptions = ref<SubscriptionItem[]>([])
const loading = ref(true)
const currentPage = ref(1)
const totalPages = ref(1)

const fetchSubscriptions = async (page = 1) => {
  try {
    loading.value = true
    const response = await getMySubscriptions({ page, limit: 20 })
    subscriptions.value = response.data || []
    currentPage.value = response.current_page || 1
    totalPages.value = response.last_page || 1

    // 获取缺失的详情信息
    const pendingDetails = subscriptions.value.map(async (item) => {
      if (item.title) return // 已经有详情了

      try {
        let details
        if (item.media_type === 'movie') {
          details = await getMovieDetails(item.media_id)
        } else if (item.media_type === 'tv') {
          details = await getTVShowDetails(item.media_id)
        }

        if (details) {
          item.title = details.title || details.name
          item.poster_path = details.poster_path
          item.backdrop_path = details.backdrop_path
          item.release_date = details.release_date || details.first_air_date
          item.vote_average = details.vote_average
          item.status = details.status
        }
      } catch (err) {
        console.error(`Failed to fetch details for ${item.media_type} ${item.media_id}`, err)
      }
    })

    await Promise.all(pendingDetails)
  } catch (error) {
    console.error('Failed to fetch subscriptions:', error)
    subscriptions.value = []
  } finally {
    loading.value = false
  }
}

const getPosterUrl = (path: string | undefined) => {
  if (!path) return ''
  return `${tmdbImageBaseUrl.value}/t/p/w342${path}`
}

const formatDate = (date: string | undefined) => {
  if (!date) return ''
  return new Date(date).getFullYear().toString()
}

const navigateToMedia = (item: SubscriptionItem) => {
  navigateTo(`/${item.media_type}/${item.media_id}`)
}

onMounted(() => {
  fetchSubscriptions()
})
</script>

<template>
  <div class="bg-surface-50 dark:bg-surface-950 min-h-screen">
    <div class="relative h-48 bg-gradient-to-b from-primary-500 to-transparent">
      <!-- Background decoration -->
      <div class="absolute inset-0"></div>
      
      <!-- Content -->
      <div class="relative h-full flex items-center justify-center">
        <div class="text-center text-white">
          <h1 class="text-5xl font-bold mb-4">{{ t('my_subscriptions') }}</h1>
          <p class="text-xl opacity-90">{{ t('my_subscriptions_subtitle') }}</p>
        </div>
      </div>
      
      <!-- Bottom gradient -->
      <div class="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-b from-transparent to-surface-50 dark:to-surface-950"></div>
    </div>

    <div class="px-4 py-8 mx-auto max-w-7xl sm:px-6 lg:px-8">
      <!-- Loading State -->
      <div v-if="loading" class="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
        <div v-for="i in 12" :key="i" class="aspect-[2/3] rounded-lg bg-surface-200 dark:bg-surface-800 animate-pulse"></div>
      </div>

      <!-- Content State -->
      <div v-else-if="subscriptions.length > 0">
        <div class="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          <div 
            v-for="item in subscriptions" 
            :key="item.id"
            class="group relative cursor-pointer"
            @click="navigateToMedia(item)"
          >
            <div class="aspect-[2/3] overflow-hidden rounded-lg bg-surface-200 dark:bg-surface-800 relative shadow-sm hover:shadow-md transition-shadow">
              <ImageLazy
                :src="getPosterUrl(item.poster_path)"
                :alt="item.title || ''"
                class="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
              <div class="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </div>
            <div class="mt-2">
              <h3 class="text-sm font-medium text-surface-900 dark:text-surface-100 truncate" :title="item.title || ''">
                {{ item.title }}
              </h3>
              <div class="flex items-center justify-between mt-1">
                <span class="text-xs text-surface-500 dark:text-surface-400">{{ formatDate(item.release_date) }}</span>
                <div v-if="item.vote_average" class="flex items-center gap-1 text-xs text-yellow-500">
                  <i class="pi pi-star-fill text-[10px]"></i>
                  <span>{{ item.vote_average.toFixed(1) }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Pagination -->
        <div v-if="totalPages > 1" class="flex justify-center mt-8 gap-2">
          <button 
            @click="fetchSubscriptions(currentPage - 1)" 
            :disabled="currentPage === 1"
            class="px-3 py-1 text-sm rounded-md bg-surface-100 dark:bg-surface-800 hover:bg-surface-200 dark:hover:bg-surface-700 disabled:opacity-50"
          >
            {{ t('previous') }}
          </button>
          <span class="px-3 py-1 text-sm">{{ currentPage }} / {{ totalPages }}</span>
          <button 
            @click="fetchSubscriptions(currentPage + 1)" 
            :disabled="currentPage === totalPages"
            class="px-3 py-1 text-sm rounded-md bg-surface-100 dark:bg-surface-800 hover:bg-surface-200 dark:hover:bg-surface-700 disabled:opacity-50"
          >
            {{ t('next') }}
          </button>
        </div>
      </div>

      <!-- Empty State -->
      <div v-else class="flex flex-col items-center justify-center py-20 text-center">
        <div class="w-24 h-24 mb-6 rounded-full bg-surface-100 dark:bg-surface-800 flex items-center justify-center">
          <i class="pi pi-heart text-4xl text-surface-400 dark:text-surface-500"></i>
        </div>
        <h3 class="text-xl font-medium text-surface-900 dark:text-surface-100 mb-2">{{ t('no_subscriptions') }}</h3>
        <p class="text-surface-500 dark:text-surface-400 max-w-md mb-8">{{ t('no_subscriptions_desc') }}</p>
        <button 
          @click="navigateTo('/movies')"
          class="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-600 transition-colors"
        >
          {{ t('go_to_discover') }}
        </button>
      </div>
    </div>
  </div>
</template>
