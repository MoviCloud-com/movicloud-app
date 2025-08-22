<template>
  <div 
    ref="imageRef"
    class="relative w-full h-full"
  >
    <!-- 懒加载占位 -->
    <div 
      v-if="!isInViewport || (!isLoaded && !hasError)"
      class="absolute inset-0 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 flex items-center justify-center"
    >
      <div class="text-center">
        <i class="pi pi-image text-gray-400 dark:text-gray-500 text-lg mb-1"></i>
        <div class="w-6 h-0.5 bg-gray-300 dark:bg-gray-600 rounded-full overflow-hidden">
          <div class="h-full bg-gray-400 dark:text-gray-500 animate-pulse"></div>
        </div>
      </div>
    </div>
    
    <!-- 懒加载图片 -->
    <img
      v-if="isInViewport && !hasError"
      :data-src="src"
      :alt="alt"
      :class="imgClass"
      @load="onImageLoad"
      @error="onImageError"
    />
    
    <!-- 加载失败时的默认图标 -->
    <div 
      v-if="hasError"
      class="absolute inset-0 bg-gray-300 dark:bg-gray-600 flex items-center justify-center"
    >
      <i 
        :class="[
          'text-white text-xl',
          props.defaultIcon === 'user' ? 'pi pi-user' : 
          props.defaultIcon === 'video' ? 'pi pi-video' : 'pi pi-image'
        ]"
      ></i>
    </div>
  </div>
</template>

<script setup lang="ts" name="ImageLazy">
import { useLazyImage } from '../composables/useLazyImage'

interface Props {
  src: string
  alt: string
  imgClass?: string
  priority?: 'high' | 'normal' | 'low'
  rootMargin?: string
  defaultIcon?: 'user' | 'image' | 'video'
  root?: Element | null
}

const props = withDefaults(defineProps<Props>(), {
  imgClass: 'absolute inset-0 w-full h-full object-cover',
  priority: 'normal',
  rootMargin: '50px',
  defaultIcon: 'user'
})

const emit = defineEmits<{
  load: []
  error: []
}>()

// 使用懒加载
const { imageRef, isInViewport, isLoaded, hasError } = useLazyImage({
  priority: props.priority,
  rootMargin: props.rootMargin,
  root: props.root
})

// 图片加载完成
const onImageLoad = () => {
  emit('load')
}

// 图片加载失败
const onImageError = () => {
  emit('error')
}
</script> 