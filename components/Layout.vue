<script setup lang="ts">
import AppTopbar from "./AppTopbar.vue";
import AppSidebar from "./AppSidebar.vue";
import SearchModal from "./SearchModal.vue";
import { useAuth } from '../composables/useAuth';
import type { LayoutProps } from '../types';
import { useLayoutStore } from '../stores/layout';
import { useRoute } from 'vue-router';

const props = withDefaults(defineProps<LayoutProps & {
  showWelcomeTitle?: boolean
  scrollThreshold?: number
  welcomeTitle?: string
  welcomeSubtitle?: string
}>(), {
  showBreadcrumb: false,
  backgroundType: 'transparent',
  showBorder: false,
  showWelcomeTitle: false,
  scrollThreshold: 200,
  welcomeTitle: '欢迎来到 MoviCloud',
  welcomeSubtitle: '发现最新最热门的电影和电视剧'
});

const layoutStore = useLayoutStore();
const route = useRoute();

// 认证相关
const { isLoggedIn } = useAuth();

// 判断是否为首页
const isHomePage = computed(() => route.path === '/')

// 滚动状态
const isScrolled = ref(false)

// 搜索模态框状态
const searchModalVisible = ref(false)

// 滚动监听
const handleScroll = () => {
  const scrollY = window.scrollY
  const threshold = props.scrollThreshold
  const newScrolledState = scrollY > threshold
  
  isScrolled.value = newScrolledState
}

// 打开搜索模态框
const openSearch = () => {
  searchModalVisible.value = true
}

// 客户端挂载时初始化
onMounted(() => {
  if (typeof window !== 'undefined') {
    window.addEventListener('scroll', handleScroll)
    // 初始化时检查一次
    handleScroll()
  }
})

onUnmounted(() => {
  if (typeof window !== 'undefined') {
    window.removeEventListener('scroll', handleScroll)
  }
})
</script>

<template>
    <div class="min-h-screen">
        <!-- 侧边栏 -->
        <AppSidebar />
        
        <!-- 主内容区域 -->
        <div 
            class="transition-all duration-300"
            :class="{
                'ml-64': !layoutStore.sidebarCollapsed,
                'ml-20': layoutStore.sidebarCollapsed
            }"
        >
            <!-- 顶栏 -->
            <AppTopbar 
                :background-type="backgroundType" 
                :show-border="showBorder" 
                :show-breadcrumb="showBreadcrumb" 
                :show-welcome-title="showWelcomeTitle"
                :scroll-threshold="scrollThreshold"
                :is-scrolled="isScrolled"
                :welcome-title="welcomeTitle"
                :welcome-subtitle="welcomeSubtitle"
                @open-search="openSearch"
            />
            
            <!-- 背景内容插槽 -->
            <div class="relative">
                <slot name="background">
                </slot>
            </div>
            
            <!-- 主要内容 -->
            <main class="-mt-18 bg-surface-50 dark:bg-surface-950">
                <slot></slot>
            </main>
        </div>
        
        <!-- 搜索模态框 -->
        <SearchModal v-model:visible="searchModalVisible" />
    </div>
</template>