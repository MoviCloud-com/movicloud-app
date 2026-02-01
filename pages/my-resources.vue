<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import { t } from '../composables/useI18n'
import { useMoviCloudAPI, type ResourceItem } from '../composables/useMoviCloudAPI'
import { useTMDBClient } from '../composables/useTMDBClient'
import { useSettingsCache } from '../composables/useSettingsCache'
import { useCloudDrives } from '../composables/useCloudDrives'
import { useMediaInfo } from '../composables/useMediaInfo'
import ImageLazy from '../components/ImageLazy.vue'

// 页面元数据
useHead({
  title: `${t('my_resources')} - MoviCloud`,
  meta: [
    { name: 'description', content: t('my_resources_subtitle') }
  ]
})

const { getMyResources, loading: apiLoading } = useMoviCloudAPI()
const { getMovieDetails, getTVShowDetails } = useTMDBClient()
const { tmdbImageBaseUrl } = useSettingsCache()
const { getDriveByCode } = useCloudDrives()
const { getResourceTypeByCode, getResolutionByCode, getVideoCodecByCode, getAudioCodecByCode } = useMediaInfo()

const resources = ref<ResourceItem[]>([])
const loading = ref(true)
const loadingMore = ref(false)
const currentPage = ref(1)
const totalPages = ref(1)
const hasMore = ref(true)
const activeTab = ref<'movie' | 'tv'>('movie')

const fetchResources = async (isLoadMore = false) => {
  try {
    if (isLoadMore) {
      loadingMore.value = true
    } else {
      loading.value = true
    }
    
    const response = await getMyResources({ 
      page: currentPage.value, 
      limit: 20,
      type: activeTab.value
    })
    console.log('My Resources Response:', response)
    
    const newItems = response.data || []
    
    // 获取缺失的详情信息
    const pendingDetails = newItems.map(async (item) => {
      try {
        let details
        if (item.type === 'movie') {
          details = await getMovieDetails(item.mediaId)
        } else if (item.type === 'tv') {
          details = await getTVShowDetails(item.mediaId)
        }

        if (details) {
          item.title = details.title || details.name
          item.poster_path = details.poster_path
        }
      } catch (err) {
        console.error(`Failed to fetch details for ${item.type} ${item.mediaId}`, err)
      }
    })

    await Promise.all(pendingDetails)
    
    if (isLoadMore) {
      resources.value.push(...newItems)
    } else {
      resources.value = newItems
    }
    
    currentPage.value = response.current_page || 1
    totalPages.value = response.last_page || 1
    hasMore.value = currentPage.value < totalPages.value
  } catch (error) {
    console.error('Failed to fetch resources:', error)
    if (!isLoadMore) {
      resources.value = []
    }
  } finally {
    loading.value = false
    loadingMore.value = false
  }
}

const handleTabChange = (type: 'movie' | 'tv') => {
  if (activeTab.value === type) return
  activeTab.value = type
  currentPage.value = 1
  resources.value = []
  hasMore.value = true
  fetchResources()
}

const loadMore = async () => {
  if (loadingMore.value || !hasMore.value) return
  
  currentPage.value++
  await fetchResources(true)
}

const handleScroll = () => {
  const scrollTop = window.pageYOffset || document.documentElement.scrollTop
  const windowHeight = window.innerHeight
  const documentHeight = document.documentElement.scrollHeight
  
  // 当滚动到距离底部100px时加载更多
  if (scrollTop + windowHeight >= documentHeight - 100) {
    loadMore()
  }
}

const getPosterUrl = (path: string | undefined) => {
  if (!path) return ''
  return `${tmdbImageBaseUrl.value}/t/p/w342${path}`
}

const formatDate = (date: string) => {
  if (!date) return ''
  return new Date(date).toLocaleDateString()
}

const navigateToResource = (resource: ResourceItem) => {
  if (resource.type && resource.mediaId) {
    navigateTo(`/${resource.type}/${resource.mediaId}`)
  }
}

// 阻止事件冒泡并打开链接
const openDriveLink = (link: string, event: Event) => {
  event.stopPropagation()
  if (link) {
    window.open(link, '_blank')
  }
}


onMounted(() => {
  fetchResources()
  window.addEventListener('scroll', handleScroll)
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
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
          <h1 class="text-5xl font-bold mb-4">{{ t('my_resources') }}</h1>
          <p class="text-xl opacity-90">{{ t('my_resources_subtitle') }}</p>
        </div>
      </div>
      
      <!-- Bottom gradient -->
      <div class="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-b from-transparent to-surface-50 dark:to-surface-950"></div>
    </div>

    <div class="px-4 py-8 mx-auto max-w-7xl sm:px-6 lg:px-8">
      <!-- Tabs -->
      <div class="flex space-x-1 rounded-xl bg-surface-200/50 dark:bg-surface-800/50 p-1 mb-6 max-w-sm mx-auto">
        <button
          v-for="tab in ['movie', 'tv'] as const"
          :key="tab"
          @click="handleTabChange(tab)"
          class="w-full rounded-lg py-2.5 text-sm font-medium leading-5 transition-all duration-200"
          :class="[
            activeTab === tab
              ? 'bg-white dark:bg-surface-700 text-primary-500 shadow'
              : 'text-surface-600 dark:text-surface-400 hover:bg-white/[0.12] hover:text-primary-600 dark:hover:text-primary-400'
          ]"
        >
          {{ tab === 'movie' ? t('movies') : t('tv_shows') }}
        </button>
      </div>

      <div v-if="loading && resources.length === 0" class="space-y-4">
        <div v-for="i in 5" :key="i" class="h-24 rounded-lg bg-surface-200 dark:bg-surface-800 animate-pulse"></div>
      </div>

      <div v-else-if="resources.length > 0">
        <div class="space-y-4">
          <div 
            v-for="item in resources" 
            :key="item.id"
            class="p-4 rounded-lg bg-surface-0 dark:bg-surface-900 border border-surface-200 dark:border-surface-800 shadow-sm cursor-pointer hover:shadow-md transition-shadow flex gap-4"
            @click="navigateToResource(item)"
          >
            <!-- Poster -->
            <div class="w-20 sm:w-24 flex-shrink-0">
              <div class="aspect-[2/3] rounded-lg overflow-hidden bg-surface-200 dark:bg-surface-800">
                <ImageLazy
                  :src="getPosterUrl(item.poster_path)"
                  :alt="item.title || ''"
                  class="w-full h-full object-cover"
                />
              </div>
            </div>

            <!-- Content -->
            <div class="flex-1 min-w-0">
              <div class="flex justify-between items-start">
                <div>
                  <h3 class="text-base sm:text-lg font-medium text-surface-900 dark:text-surface-100 mb-1 truncate" :title="item.title || ''">
                    {{ item.title || t('loading') }}
                    <span v-if="item.type === 'tv' && item.seasonNumber" class="ml-2 text-sm text-surface-500 font-normal">
                      {{ item.seasonNumber.toString() === item.mediaId.toString() ? t('all_seasons') : `S${item.seasonNumber.toString().padStart(2, '0')}` }}
                    </span>
                  </h3>
                  <div class="flex flex-wrap items-center gap-2 mb-2">
                    <span class="text-xs sm:text-sm font-medium px-2 py-0.5 rounded bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300">
                      {{ getResourceTypeByCode(item.resourceType)?.label }}
                    </span>
                    <span class="text-xs sm:text-sm text-surface-500 dark:text-surface-400 border border-surface-200 dark:border-surface-700 px-1.5 rounded">{{ getResolutionByCode(item.resolution)?.label || item.resolution }}</span>
                    <span class="text-xs sm:text-sm text-surface-500 dark:text-surface-400 border border-surface-200 dark:border-surface-700 px-1.5 rounded">{{ item.fileSize }}</span>
                    <span v-if="item.videoCodec" class="text-xs sm:text-sm text-surface-500 dark:text-surface-400 border border-surface-200 dark:border-surface-700 px-1.5 rounded flex items-center">
                      <i class="pi pi-video mr-1 text-[10px]"></i>
                      {{ getVideoCodecByCode(item.videoCodec)?.label || item.videoCodec }}
                    </span>
                    <span v-if="item.audioCodec" class="text-xs sm:text-sm text-surface-500 dark:text-surface-400 border border-surface-200 dark:border-surface-700 px-1.5 rounded flex items-center">
                      <i class="pi pi-volume-up mr-1 text-[10px]"></i>
                      {{ getAudioCodecByCode(item.audioCodec)?.label || item.audioCodec }}
                    </span>
                  </div>
                </div>
                <div class="text-right flex-shrink-0 ml-2">
                  <div class="text-xs sm:text-sm text-surface-900 dark:text-surface-100 font-mono">{{ formatDate(item.createdAt) }}</div>
                  <div class="mt-1">
                    <span 
                      class="text-xs px-2 py-0.5 rounded-full"
                      :class="{
                        'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300': item.status === 'approved',
                        'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300': item.status === 'pending',
                        'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300': item.status === 'rejected'
                      }"
                    >
                      {{ t(item.status) }}
                    </span>
                  </div>
                </div>
              </div>
              <div 
                class="mt-2 flex items-center gap-2 text-xs text-surface-500 dark:text-surface-400 font-mono bg-surface-50 dark:bg-surface-950 p-2 rounded hover:text-primary-500 hover:bg-surface-100 dark:hover:bg-surface-900 transition-colors cursor-pointer"
                @click="openDriveLink(item.driveLink, $event)"
              >
                <div class="flex items-center gap-1.5 flex-shrink-0 select-none">
                  <img 
                    v-if="getDriveByCode(item.cloudDriveCode)?.logo"
                    :src="getDriveByCode(item.cloudDriveCode)?.logo" 
                    class="w-4 h-4 rounded-sm"
                    :alt="getDriveByCode(item.cloudDriveCode)?.name"
                  />
                  <span class="font-medium">{{ getDriveByCode(item.cloudDriveCode)?.name || item.cloudDriveCode }}</span>
                </div>
                <div class="w-px h-3 bg-surface-300 dark:bg-surface-700 mx-1"></div>
                <div class="truncate flex-1">{{ item.driveLink }}</div>
              </div>
            </div>
          </div>
          <!-- Load More Status -->
          <div v-if="loadingMore" class="mt-8 text-center">
            <div class="inline-flex items-center gap-2 text-surface-600 dark:text-surface-400">
              <i class="pi pi-spin pi-spinner"></i>
              <span>{{ t('loading_more') }}...</span>
            </div>
          </div>

          <div v-else-if="!hasMore && resources.length > 0" class="mt-8 text-center">
            <p class="text-surface-600 dark:text-surface-400 text-sm">{{ t('no_more_data') }}</p>
          </div>
        </div>
      </div>

      <div v-else class="flex flex-col items-center justify-center py-20 text-center">
        <div class="w-24 h-24 mb-6 rounded-full bg-surface-100 dark:bg-surface-800 flex items-center justify-center">
          <i class="pi pi-database text-4xl text-surface-400 dark:text-surface-500"></i>
        </div>
        <h3 class="text-xl font-medium text-surface-900 dark:text-surface-100 mb-2">{{ t('no_resources') }}</h3>
        <p class="text-surface-500 dark:text-surface-400 max-w-md mb-8">{{ t('no_resources_desc') }}</p>
        <button 
          @click="navigateTo('/movies')"
          class="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-600 transition-colors"
        >
          {{ t('go_to_share') }}
        </button>
      </div>
    </div>
  </div>
</template>
