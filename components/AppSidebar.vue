<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useLayoutStore } from '../stores/layout'
import { t } from '../composables/useI18n'

const router = useRouter()
const route = useRoute()
const layoutStore = useLayoutStore()

// 使用 Pinia store 的状态
const sidebarCollapsed = computed(() => layoutStore.sidebarCollapsed)

// 切换侧边栏 - 使用 store 的方法
const toggleSidebar = () => {
  layoutStore.toggleSidebar()
}

// 侧边栏样式
const sidebarStyle = computed(() => {
  return {
    width: sidebarCollapsed.value ? '80px' : '256px',
    transition: 'width 0.3s ease'
  }
})

// 菜单项定义 - 使用computed属性以支持多语言
const menuItems = computed(() => [
  {
    id: 'home',
    label: t('home'),
    icon: 'pi pi-home',
    route: '/'
  },
  {
    id: 'movies',
    label: t('movies'),
    icon: 'pi pi-video',
    route: '/movies'
  },
  {
    id: 'tv-shows',
    label: t('tv'),
    icon: 'pi pi-desktop',
    route: '/tv'
  },
  // {
  //   id: 'files',
  //   label: t('file_management'),
  //   icon: 'pi pi-folder',
  //   route: '/cloud'
  // },
  {
    id: 'settings',
    label: t('settings'),
    icon: 'pi pi-cog',
    route: '/settings'
  }
])

const setActiveMenu = (menuId: string) => {
  // 设置活动菜单
}
</script>

<template>
  <div 
    class="bg-surface-0 dark:bg-surface-900 border-r border-surface-200 dark:border-surface-700 flex flex-col flex-shrink-0 fixed left-0 top-0 z-50"
    style="height: 100vh;"
    :style="sidebarStyle"
  >

    <!-- Logo区域 -->
    <div :class="[
      'flex-shrink-0',
      sidebarCollapsed ? 'p-3' : 'p-4'
    ]">
      <router-link to="/" class="flex items-center justify-center gap-3">
        <!-- SVG Logo -->
        <svg
          width="35"
          height="35"
          viewBox="5 4 27 22"
          fill="none"
          class="flex-shrink-0 w-16 h-16"
          xmlns="http://www.w3.org/2000/svg"
        >
          <!-- 云朵背景 -->
          <path
            d="M26.5 12C26.5 8.41 23.59 5.5 20 5.5C17.24 5.5 14.91 7.34 14.21 9.9C13.8 9.8 13.4 9.75 13 9.75C10.24 9.75 8 11.99 8 14.75C8 15.44 8.15 16.09 8.42 16.67C6.97 17.54 6 19.15 6 21C6 23.76 8.24 26 11 26H26C28.76 26 31 23.76 31 21C31 18.79 29.79 16.88 28 16.25C27.84 13.94 27.42 12 26.5 12Z"
            class="fill-primary/20"
          />
          
          <!-- 胶片卷轴 -->
          <rect x="10" y="13" width="16" height="11" rx="1" class="fill-primary" />
          
          <!-- 胶片孔 -->
          <circle cx="12" cy="15.5" r="0.8" class="fill-surface-0 dark:fill-surface-900" />
          <circle cx="12" cy="18.5" r="0.8" class="fill-surface-0 dark:fill-surface-900" />
          <circle cx="12" cy="21.5" r="0.8" class="fill-surface-0 dark:fill-surface-900" />
          
          <circle cx="23" cy="15.5" r="0.8" class="fill-surface-0 dark:fill-surface-900" />
          <circle cx="23" cy="18.5" r="0.8" class="fill-surface-0 dark:fill-surface-900" />
          <circle cx="23" cy="21.5" r="0.8" class="fill-surface-0 dark:fill-surface-900" />
          
          <!-- 播放按钮 -->
          <circle cx="17.5" cy="19" r="3" class="fill-surface-0 dark:fill-surface-900" />
          <path
            d="M16.5 17L19.5 19L16.5 21V17Z"
            class="fill-primary"
          />
        </svg>
        <div v-if="!sidebarCollapsed" class="flex flex-col text-center">
          <span class="text-lg font-bold text-surface-900 dark:text-surface-0">MoviCloud</span>
          <span class="text-xs text-surface-500 dark:text-surface-400">{{ t('movie_cloud') }}</span>
        </div>
      </router-link>
    </div>

    <!-- 导航菜单 -->
    <nav :class="[
      'flex-1',
      sidebarCollapsed ? 'px-2 py-3' : 'px-3 py-2'
    ]">
      <!-- 展开状态：单列布局，图标和文字水平排列 -->
      <ul v-if="!sidebarCollapsed" class="space-y-1">
        <li v-for="item in menuItems" :key="item.id">
          <router-link
            :to="item.route"
            @click="setActiveMenu(item.id)"
            :class="[
              'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group',
              'border border-transparent',
              'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1',
              $route.path === item.route
                ? 'bg-primary text-primary-contrast border-primary shadow-md hover:bg-primary hover:text-primary-contrast'
                : 'text-surface-700 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-800 hover:border-surface-200 dark:hover:border-surface-700'
            ]"
          >
            <!-- 图标 -->
            <div :class="[
              'flex items-center justify-center rounded-lg transition-all duration-200 w-8 h-8 flex-shrink-0',
              $route.path === item.route
                ? 'bg-primary-contrast/20' 
                : 'bg-surface-100 dark:bg-surface-800 group-hover:bg-surface-200 dark:group-hover:bg-surface-700'
            ]">
              <i :class="[
                item.icon, 
                'text-base',
                $route.path === item.route
                  ? 'text-primary-contrast' 
                  : 'text-surface-600 dark:text-surface-400 group-hover:text-surface-800 dark:group-hover:text-surface-200'
              ]" />
            </div>
            
            <!-- 菜单名称 -->
            <span :class="[
              'font-medium transition-all duration-200 text-sm',
              $route.path === item.route
                ? 'text-primary-contrast' 
                : 'text-surface-700 dark:text-surface-300 group-hover:text-surface-900 dark:group-hover:text-surface-100'
            ]">
              {{ item.label }}
            </span>
          </router-link>
        </li>
      </ul>

      <!-- 收起状态：从顶部开始排列的圆形按钮 -->
      <div v-else class="flex flex-col items-center space-y-3">
        <div v-for="item in menuItems" :key="item.id" class="relative group">
          <router-link
            :to="item.route"
            @click="setActiveMenu(item.id)"
            :class="[
              'flex items-center justify-center w-11 h-11 rounded-full transition-all duration-300 group relative',
              'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
              $route.path === item.route
                ? 'bg-primary text-primary-contrast shadow-lg scale-110 hover:bg-primary hover:text-primary-contrast hover:scale-110'
                : 'text-surface-600 dark:text-surface-400 hover:bg-surface-100 dark:hover:bg-surface-800 hover:text-surface-800 dark:hover:text-surface-200 hover:scale-105'
            ]"
          >
            <i :class="[
              item.icon, 
              'text-lg transition-all duration-200',
              $route.path === item.route
                ? 'text-primary-contrast' 
                : 'group-hover:scale-110'
            ]" />
          </router-link>
          
          <!-- Tooltip -->
          <div :class="[
            'absolute left-full ml-3 top-1/2 transform -translate-y-1/2',
            'bg-surface-900 dark:bg-surface-100 text-surface-0 dark:text-surface-900',
            'px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap',
            'opacity-0 invisible group-hover:opacity-100 group-hover:visible',
            'transition-all duration-200 z-50',
            'shadow-lg border border-surface-200 dark:border-surface-700'
          ]">
            {{ item.label }}
            <!-- 箭头 -->
            <div :class="[
              'absolute right-full top-1/2 transform -translate-y-1/2',
              'w-0 h-0 border-t-4 border-b-4 border-r-4',
              'border-t-transparent border-b-transparent',
              'border-r-surface-900 dark:border-r-surface-100'
            ]"></div>
          </div>
        </div>
      </div>
    </nav>

    <!-- 折叠按钮 -->
    <div :class="[
      'border-t border-surface-200 dark:border-surface-700 flex-shrink-0',
      sidebarCollapsed ? 'p-2' : 'p-3'
    ]">
      <button
        @click="toggleSidebar"
        :class="[
          'w-full flex items-center justify-center gap-2 rounded-lg transition-all duration-200',
          'bg-surface-100 dark:bg-surface-800 hover:bg-surface-200 dark:hover:bg-surface-700',
          'text-surface-700 dark:text-surface-300 hover:text-surface-900 dark:hover:text-surface-100',
          'focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2',
          sidebarCollapsed ? 'h-11 w-11 mx-auto' : 'px-3 py-2.5'
        ]"
      >
        <i :class="[
          'pi transition-transform duration-200',
          sidebarCollapsed ? 'pi-angle-right text-base' : 'pi-angle-left text-sm'
        ]" />
        <span v-if="!sidebarCollapsed" class="text-sm font-medium">{{ t('collapse_menu') }}</span>
      </button>
    </div>
  </div>
</template>