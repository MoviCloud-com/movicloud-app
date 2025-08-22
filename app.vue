<script setup lang="ts">
import { useLayout } from './composables/use-layout';
import Layout from './components/Layout.vue';
import Toast from './volt/Toast.vue';
import ConfirmDialog from './volt/ConfirmDialog.vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuth } from './composables/useAuth';
import { initLanguage, t } from './composables/useI18n'

// 初始化布局
const { isDarkMode } = useLayout()

// 认证相关
const { isLoggedIn, syncTokenToCookie } = useAuth()
const route = useRoute()
const router = useRouter()

// 判断是否为公开路由
const isPublicRoute = computed(() => {
  return ['/install', '/login'].includes(route.path)
})

// 判断是否为特殊路由
const isSpecialRoute = computed(() => {
  return route.path.startsWith('/test-')
})

// 欢迎信息
const welcomeInfo = computed(() => {
  const hour = new Date().getHours()
  let greeting = ''
  
  if (hour < 6) {
    greeting = t('greeting_late_night')
  } else if (hour < 12) {
    greeting = t('greeting_morning')
  } else if (hour < 18) {
    greeting = t('greeting_afternoon')
  } else {
    greeting = t('greeting_evening')
  }
  
  return {
    title: t('welcome_to_movicloud'),
    subtitle: greeting
  }
})

// 路由守卫
watch(() => route.path, async (newPath) => {
  // 如果是公开路由，不需要检查认证
  if (isPublicRoute.value) {
    return
  }
  
  // 检查认证状态
  if (!isLoggedIn()) {
    await router.push('/login')
    return
  }
  
  // 同步token到cookie
  if (isLoggedIn()) {
    syncTokenToCookie()
  }
}, { immediate: true })

// 初始化
onMounted(async () => {
  // 同步token到cookie
  if (isLoggedIn()) {
    syncTokenToCookie()
  }
  await initLanguage()
})
</script>

<template>
  <div>
    <!-- Toast组件 -->
    <Toast />
    
    <!-- ConfirmDialog组件 -->
    <ConfirmDialog />
    
    <!-- 公开页面和特殊路由不使用Layout -->
    <NuxtPage v-if="isPublicRoute || isSpecialRoute" />
    
    <!-- 需要认证的页面使用Layout -->
    <Layout 
      v-else
      :background-type="'transparent'"
      :show-welcome-title="true"
      :welcome-title="welcomeInfo.title"
      :welcome-subtitle="welcomeInfo.subtitle"
    >
      <NuxtPage />
    </Layout>
  </div>
</template>
