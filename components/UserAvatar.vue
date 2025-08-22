<template>
  <svg 
    :width="size" 
    :height="size" 
    viewBox="0 0 100 100" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg"
    class="user-avatar"
  >
    <!-- 背景圆形 -->
    <circle 
      cx="50" 
      cy="50" 
      r="50" 
      :fill="backgroundColor"
    />
    
    <!-- 头部 -->
    <circle 
      cx="50" 
      cy="35" 
      r="15" 
      :fill="foregroundColor"
    />
    
    <!-- 身体 -->
    <path 
      d="M20 85 C20 65 35 55 50 55 C65 55 80 65 80 85" 
      :fill="foregroundColor"
    />
  </svg>
</template>

<script setup lang="ts">
interface Props {
  size?: number
  color?: string
}

const props = withDefaults(defineProps<Props>(), {
  size: 80,
  color: ''
})

// 根据主题获取颜色
const { isDarkMode } = useLayout()

// 获取CSS变量中的primary颜色
const getPrimaryColor = () => {
  if (typeof window !== 'undefined') {
    return getComputedStyle(document.documentElement).getPropertyValue('--color-primary-100').trim() || '#6366F1'
  }
  return '#6366F1' // 默认颜色
}

// 获取CSS变量中的surface颜色
const getSurfaceColor = () => {
  if (typeof window !== 'undefined') {
    return getComputedStyle(document.documentElement).getPropertyValue('--color-primary-500').trim() || 
           getComputedStyle(document.documentElement).getPropertyValue('--color-primary-300').trim() || 
           (isDarkMode.value ? '#374151' : '#E5E7EB')
  }
  return isDarkMode.value ? '#374151' : '#E5E7EB' // 默认颜色
}

// 响应式颜色状态
const backgroundColor = ref(getSurfaceColor())
const foregroundColor = ref(getPrimaryColor())

// 更新颜色的函数
const updateColors = () => {
  backgroundColor.value = props.color || getSurfaceColor()
  foregroundColor.value = props.color || getPrimaryColor()
}

// 监听主题变化
watch(() => isDarkMode.value, () => {
  updateColors()
})

// 监听props.color变化
watch(() => props.color, () => {
  updateColors()
})

// 组件挂载时初始化颜色
onMounted(() => {
  updateColors()
  
  // 监听CSS变量变化（如果支持）
  if (typeof window !== 'undefined') {
    const observer = new MutationObserver(() => {
      updateColors()
    })
    
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['style', 'class']
    })
  }
})
</script>

<style scoped>
.user-avatar {
  transition: all 0.3s ease;
}
</style>
