<template>
    <div class="grid gap-4 responsive-grid">
      <slot />
    </div>
  </template>
  
  <script setup lang="ts">
  interface Props {
    // 可选的自定义网格类，如果不提供则使用默认的响应式逻辑
    customGridClasses?: string
  }
  
  const props = defineProps<Props>()
  
  // 默认的响应式网格类计算
  const getDefaultGridClasses = () => {
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
  
  // 响应式网格类
  const gridClasses = ref(props.customGridClasses || getDefaultGridClasses())
  
  // 监听窗口大小变化
  const updateGridClasses = () => {
    if (!props.customGridClasses) {
      gridClasses.value = getDefaultGridClasses()
    }
  }
  
  onMounted(() => {
    if (!props.customGridClasses) {
      window.addEventListener('resize', updateGridClasses)
    }
  })
  
  onUnmounted(() => {
    if (!props.customGridClasses) {
      window.removeEventListener('resize', updateGridClasses)
    }
  })
  </script>
  
  <style scoped>
  /* 自定义网格列数 - 只影响当前组件 */
  .responsive-grid {
    /* 超大屏 (≥1920px) */
    @media (min-width: 1920px) {
      grid-template-columns: repeat(12, minmax(0, 1fr)) !important;
    }
    
    /* 大屏 (1536px - 1919px) */
    @media (min-width: 1536px) and (max-width: 1919px) {
      grid-template-columns: repeat(9, minmax(0, 1fr)) !important;
    }
    
    /* 中等大屏 (1280px - 1535px) */
    @media (min-width: 1280px) and (max-width: 1535px) {
      grid-template-columns: repeat(7, minmax(0, 1fr)) !important;
    }
    
    /* 大屏 (1024px - 1279px) */
    @media (min-width: 1024px) and (max-width: 1279px) {
      grid-template-columns: repeat(5, minmax(0, 1fr)) !important;
    }
    
    /* 中等屏 (768px - 1023px) */
    @media (min-width: 768px) and (max-width: 1023px) {
      grid-template-columns: repeat(4, minmax(0, 1fr)) !important;
    }
    
    /* 小屏 (640px - 767px) */
    @media (min-width: 640px) and (max-width: 767px) {
      grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
    }
    
    /* 超小屏 (<640px) */
    @media (max-width: 639px) {
      grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
    }
  }
  </style>