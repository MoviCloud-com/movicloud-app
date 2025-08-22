<template>
  <div class="relative w-full h-[500px] 2xl:h-[700px] overflow-hidden">
    <transition-group name="fade" mode="out-in">
      <div v-if="currentItem" :key="currentItem.id + '-' + currentItem.media_type" class="absolute inset-0">
        <!-- 背景图片占位 -->
        <div 
          v-if="!backdropLoaded && !backdropError"
          class="absolute inset-0 bg-surface-200 dark:bg-surface-700 flex items-center justify-center"
        >
          <i class="pi pi-image text-surface-400 dark:text-surface-500 text-4xl"></i>
        </div>
        
        <!-- 背景图片加载失败占位 -->
        <div 
          v-if="backdropError"
          class="absolute inset-0 bg-surface-200 dark:bg-surface-700 flex items-center justify-center"
        >
          <i class="pi pi-image text-surface-400 dark:text-surface-500 text-4xl"></i>
        </div>
        
        <img
          v-if="backdropImageUrl && !backdropError"
          :src="backdropImageUrl"
          class="absolute inset-0 w-full h-full object-cover"
          :alt="getTitle(currentItem)"
          @load="onBackdropLoad"
          @error="onBackdropError"
        />
        <!-- 渐变遮罩层 - 从紫色渐变到页面背景色 -->
        <div class="absolute inset-0 bg-gradient-to-b from-transparent via-surface-50/50 to-surface-50 dark:via-surface-950/50 dark:to-surface-950"></div>
        
        <!-- 居中大Logo显示 -->
        <div v-if="currentItem.logos && currentItem.logos.logos && currentItem.logos.logos.length > 0 && logoImageUrl && !logoError" class="absolute top-8 left-8 transform z-20">
          <img
            :src="logoImageUrl"
            :alt="getTitle(currentItem) + ' logo'"
            class="max-w-120 max-h-60 object-contain drop-shadow-2xl transition-opacity duration-300"
            @error="onLogoError"
          />
        </div>
        
        <!-- 可点击区域 -->
        <div 
          class="absolute inset-0 cursor-pointer z-10"
          @click="goDetail(currentItem)"
        ></div>
        
        <!-- 内容区域 -->
        <div class="absolute left-0 bottom-0 p-8 max-w-4xl z-20 pointer-events-none">
          <h2 class="text-5xl 2xl:text-7xl font-bold text-surface-900 dark:text-surface-0 mb-4 drop-shadow-lg whitespace-nowrap overflow-hidden text-ellipsis">
            {{ getTitle(currentItem) }}
          </h2>
          <p class="text-surface-700 dark:text-surface-300 text-base md:text-lg mb-6 desc-3lines line-clamp-3 drop-shadow max-w-3xl">
            {{ currentItem.overview || '暂无简介' }}
          </p>
        </div>
      </div>
    </transition-group>
    
    <!-- 左右切换按钮 -->
    <button
      class="absolute left-4 top-1/2 -translate-y-1/2 z-30 bg-black/40 hover:bg-black/70 text-white rounded-full w-12 h-12 flex items-center justify-center transition-all duration-200 hover:scale-110"
      @click="prev"
      aria-label="上一张"
    >
      <i class="pi pi-chevron-left"></i>
    </button>
    <button
      class="absolute right-4 top-1/2 -translate-y-1/2 z-30 bg-black/40 hover:bg-black/70 text-white rounded-full w-12 h-12 flex items-center justify-center transition-all duration-200 hover:scale-110"
      @click="next"
      aria-label="下一张"
    >
      <i class="pi pi-chevron-right"></i>
    </button>
    
    <!-- 指示点 -->
    <div class="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-3 z-30">
      <span
        v-for="(item, idx) in items"
        :key="item.id + '-' + item.media_type"
        class="w-3 h-3 rounded-full transition-all duration-200 cursor-pointer"
        :class="idx === currentIndex ? 'bg-primary scale-125' : 'bg-white/50 hover:bg-white/70'"
        @click="goTo(idx)"
      ></span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import type { TMDBMovie, TMDBSeries } from '../types'
import { useSettingsCache } from '../composables/useSettingsCache'

// TrendingItem 类型：电影或剧集，且带 media_type 字段
interface TrendingItem extends Partial<TMDBMovie>, Partial<TMDBSeries> {
  id: number
  media_type: string
  backdrop_path?: string
  poster_path?: string
  title?: string
  name?: string
  overview?: string
  logos?: {
    logos: Array<{
      file_path: string
      aspect_ratio: number
      height: number
      width: number
    }>
  }
}

const props = defineProps<{
  items: TrendingItem[]
}>()

const { getBackdropUrl, getLogoUrl } = useTMDBClient()
const { tmdbImageBaseUrl } = useSettingsCache()
const router = useRouter()

const currentIndex = ref(0)
const timer = ref<NodeJS.Timeout | null>(null)

const currentItem = computed(() => {
  return props.items[currentIndex.value] || null
})

// 响应式图片URL
const backdropImageUrl = ref('')
const logoImageUrl = ref('')
const backdropLoaded = ref(false)
const backdropError = ref(false)
const logoError = ref(false)

// 同步构建图片URL（使用设置缓存中的基础URL）
const buildImageUrl = (path: string, size: string, type: 'backdrop' | 'logo' = 'backdrop') => {
  if (!path) return ''
  return `${tmdbImageBaseUrl.value}/t/p/${size}${path}`
}

// 异步加载图片URL
const loadImageUrls = async () => {
  if (currentItem.value) {
    backdropLoaded.value = false
    backdropError.value = false
    logoError.value = false
    
    // 立即设置图片URL，使用同步方式
    backdropImageUrl.value = buildImageUrl(
      currentItem.value.backdrop_path || currentItem.value.poster_path || '', 
      'w1280'
    )
    
    if (currentItem.value.logos && currentItem.value.logos.logos && currentItem.value.logos.logos.length > 0) {
      logoImageUrl.value = buildImageUrl(
        currentItem.value.logos.logos[0].file_path, 
        'original', 
        'logo'
      )
    } else {
      logoImageUrl.value = ''
    }
  }
}

// 背景图片加载完成
const onBackdropLoad = () => {
  backdropLoaded.value = true
}

// 背景图片加载失败
const onBackdropError = () => {
  backdropError.value = true
  backdropLoaded.value = false
}

// Logo图片加载失败
const onLogoError = () => {
  logoError.value = true
}





// 监听当前项目变化
watch(() => currentItem.value, () => {
  loadImageUrls()
}, { deep: true })

// 组件挂载时加载图片URL
onMounted(() => {
  loadImageUrls()
})

const getTitle = (item: TrendingItem) => {
  return item.title || item.name || ''
}

const goDetail = (item: TrendingItem) => {
  const type = item.media_type === 'movie' ? 'movie' : 'tv'
  router.push(`/${type}/${item.id}`)
}

const next = () => {
  currentIndex.value = (currentIndex.value + 1) % props.items.length
}
const prev = () => {
  currentIndex.value = (currentIndex.value - 1 + props.items.length) % props.items.length
}
const goTo = (idx: number) => {
  currentIndex.value = idx
}

const startAutoPlay = () => {
  stopAutoPlay()
  timer.value = setInterval(() => {
    next()
  }, 5000)
}
const stopAutoPlay = () => {
  if (timer.value) clearInterval(timer.value)
  timer.value = null
}

onMounted(() => {
  startAutoPlay()
})
onUnmounted(() => {
  stopAutoPlay()
})
</script>

<style scoped>
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.7s;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
.line-clamp-3 {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* 固定为“恰好三行”高度，避免第4行残影；同时配合 line-clamp-3 */
.desc-3lines { 
  --lh: 1.5;              /* base 默认行高 */
  line-height: var(--lh);
  height: calc(var(--lh) * 3em); /* 3 行的精确高度 */
}
@media (min-width: 768px) {
  .desc-3lines {
    --lh: 1.75;           /* md:text-lg 默认行高 */
    height: calc(var(--lh) * 3em);
  }
}
</style> 