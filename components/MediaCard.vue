<template>
  <div 
    class="relative group cursor-pointer overflow-hidden rounded-lg shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl"
    @click="handleClick"
  >
    <!-- 海报图片 -->
    <div 
      ref="imageRef"
      class="relative aspect-[2/3] w-full"
    >
      <!-- 懒加载占位样式 -->
      <div 
        v-if="!isInViewport || (!imageLoaded && !hasError)"
        class="absolute inset-0 bg-gradient-to-br from-surface-200 to-surface-300 dark:from-surface-700 dark:to-surface-800 rounded-lg flex items-center justify-center"
      >
        <div class="text-center">
          <i class="pi pi-image text-surface-400 dark:text-surface-500 text-2xl mb-2"></i>
          <div class="w-8 h-1 bg-surface-300 dark:bg-surface-600 rounded-full overflow-hidden">
            <div class="h-full bg-surface-400 dark:bg-surface-500 animate-pulse"></div>
          </div>
        </div>
      </div>
      
      <!-- 懒加载图片 -->
      <img
        v-if="isInViewport && !hasError"
        :data-src="posterUrl"
        :alt="title"
        class="absolute inset-0 w-full h-full object-cover rounded-lg transition-transform duration-300 group-hover:scale-105"
        @load="onImageLoad"
        @error="handleImageError"
      />
      
      <!-- 加载失败时的默认图标 -->
      <div 
        v-if="hasError"
        class="absolute inset-0 bg-gray-300 dark:bg-gray-600 rounded-lg flex items-center justify-center"
      >
        <i class="pi pi-image text-white text-2xl"></i>
      </div>
      
      <!-- 悬停时的信息遮罩 -->
      <div class="absolute inset-0 bg-black/80 opacity-0 group-hover:opacity-100 transition-opacity duration-300 p-2">
        <!-- 顶部信息行 -->
        <div class="flex justify-between items-start mb-1">
          <!-- 评分 - 左上角 -->
          <div class="flex items-center gap-1">
            <i class="pi pi-star text-yellow-400 text-sm"></i>
            <span class="text-white text-sm font-medium">{{ rating.toFixed(1) }}</span>
          </div>
          
          <!-- 年份 - 右上角 -->
          <div class="flex items-center gap-1">
            <i class="pi pi-calendar text-yellow-400 text-sm"></i>
            <span class="text-white text-sm font-medium">{{ year }}</span>
          </div>
        </div>
        
        <!-- 底部信息 -->
        <div class="absolute bottom-2 left-2 right-2">
          <!-- 国家地区 -->
          <div class="flex items-center gap-1 mb-1">
            <i class="pi pi-globe text-gray-300 text-xs"></i>
            <span class="text-gray-300 text-xs">{{ country }}</span>
          </div>
          
          <!-- 标题 -->
          <h3 class="text-white font-semibold text-lg mb-1 line-clamp-1">{{ title }}</h3>
          
          <!-- 类型 -->
          <div class="flex flex-wrap gap-1">
            <span 
              v-for="genre in genres" 
              :key="genre"
              class="p-1 bg-primary/20 text-primary text-xs rounded-lg"
            >
              {{ genre }}
            </span>
          </div>
        </div>
      </div>
      
      <!-- 播放按钮 -->
      <div class="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <div class="relative w-16 h-16 flex items-center justify-center">
          <!-- 外圈 -->
          <div class="absolute inset-0 rounded-full bg-white/20 backdrop-blur-sm"></div>
          
          <!-- 内圈 -->
          <div class="relative w-12 h-12 bg-primary/90 rounded-full flex items-center justify-center hover:scale-110 transition-transform duration-300">
            <!-- 水波效果 -->
            <div class="absolute inset-0 rounded-full bg-primary/30 animate-ripple"></div>
            <div class="absolute inset-0 rounded-full bg-primary/20 animate-ripple-delay-1"></div>
            <div class="absolute inset-0 rounded-full bg-primary/10 animate-ripple-delay-2"></div>
            
            <!-- 播放图标 -->
            <i class="pi pi-play text-white text-lg relative z-10 ml-1"></i>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  id: number
  title: string
  posterPath: string
  rating: number
  voteCount: number
  genres: string[]
  country: string
  year: string
  cast?: string[]
  type: 'movie' | 'tv'
}

const props = defineProps<Props>()

const emit = defineEmits<{
  click: [id: number, type: 'movie' | 'tv']
}>()

import { useSettingsCache } from '../composables/useSettingsCache'
import { useLazyImage } from '../composables/useLazyImage'

const { tmdbImageBaseUrl } = useSettingsCache()

// 使用懒加载，优先级为normal
const { imageRef, isInViewport, isLoaded, hasError, loadImage } = useLazyImage({
  priority: 'normal',
  rootMargin: '100px' // 提前100px开始加载
})

const imageLoaded = ref(false)
const imageError = ref(false)

// 计算属性：直接生成图片URL
const posterUrl = computed(() => {
  if (props.posterPath) {
    return `${tmdbImageBaseUrl.value}/t/p/w500${props.posterPath}`
  }
  return ''
})

// 图片加载完成
const onImageLoad = () => {
  imageLoaded.value = true
  isLoaded.value = true
}

const handleClick = () => {
  emit('click', props.id, props.type)
}

const handleImageError = (event: Event) => {
  const target = event.target as HTMLImageElement
  // 设置错误状态
  imageError.value = true
  imageLoaded.value = false
  hasError.value = true
  // 清空图片src
  target.src = ''
}
</script>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* 自定义水波动画 */
@keyframes ripple {
  0% {
    transform: scale(0.8);
    opacity: 1;
  }
  100% {
    transform: scale(2);
    opacity: 0;
  }
}

.animate-ripple {
  animation: ripple 2s infinite;
}

.animate-ripple-delay-1 {
  animation: ripple 2s infinite;
  animation-delay: 0.5s;
}

.animate-ripple-delay-2 {
  animation: ripple 2s infinite;
  animation-delay: 1s;
}
</style> 