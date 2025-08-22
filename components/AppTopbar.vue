<template>
  <header
    :class="[
      'sticky top-0 z-50 transition-all duration-300',
      backgroundClasses,
      borderClasses
    ]"
  >
    <div class="flex items-center justify-between px-6 py-4">
      <!-- 左侧内容 -->
      <div class="flex items-center space-x-4">
        <slot name="left">
          <!-- 欢迎标题 -->
          <div v-if="showWelcomeTitle && isScrolled" class="flex items-center space-x-3">
            <h1 class="text-xl font-bold text-surface-900 dark:text-surface-100">
              {{ welcomeTitle }}
            </h1>
            <p v-if="welcomeSubtitle" class="text-sm text-surface-600 dark:text-surface-400">
              {{ welcomeSubtitle }}
            </p>
          </div>
        </slot>
      </div>

      <!-- 右侧内容 -->
      <div class="flex items-center space-x-4">
        <slot name="right">
          <!-- 搜索按钮 -->
          <button
            @click="$emit('openSearch')"
            class="p-2 text-white hover:text-white transition-colors mix-blend-difference"
            :title="t('search')"
          >
            <i class="pi pi-search text-lg"></i>
          </button>

          <!-- 夜间模式切换 -->
          <button
            @click="toggleDarkMode"
            class="p-2 text-white hover:text-white transition-colors mix-blend-difference"
            :title="t('toggle_dark_mode')"
          >
            <i :class="isDarkMode ? 'pi pi-sun' : 'pi pi-moon'" class="text-lg"></i>
          </button>

          <!-- 通知按钮 -->
          <button
            class="p-2 text-white hover:text-white transition-colors relative mix-blend-difference"
            :title="t('notifications')"
          >
            <i class="pi pi-bell text-lg"></i>
            <span class="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>

          <!-- 用户信息 -->
          <div class="flex items-center space-x-3 user-menu">
            <div class="text-right">
              <p class="text-sm font-medium text-white mix-blend-difference">
                {{ getUserDisplayName(currentUser) }}
              </p>
              <p class="text-xs text-white/90 mix-blend-difference">
                {{ currentUser?.role === 'admin' ? t('admin') : t('user') }}
              </p>
            </div>
            
            <!-- 用户头像和菜单容器 -->
            <div class="relative">
              <!-- 有头像时显示图片 -->
              <div
                class="w-10 h-10 rounded-full border-2 border-surface-300 dark:border-white/30 cursor-pointer hover:opacity-80 transition-opacity overflow-hidden flex items-center justify-center"
                @click="toggleUserMenu"
              >
                <img
                  v-if="currentUser?.avatar"
                  :src="currentUser?.avatar"
                  :alt="getUserDisplayName(currentUser)"
                  class="w-full h-full object-cover"
                  @error="handleAvatarError"
                />
                <UserAvatar v-else :size="32" />
              </div>
              
              <!-- 用户菜单 -->
              <div v-if="showUserMenu" class="absolute top-full right-0 mt-2 w-48 bg-surface-0 dark:bg-surface-900 text-surface-700 dark:text-surface-0 border border-surface-200 dark:border-surface-700 rounded-md shadow-lg z-50 before:absolute before:top-0 before:right-2 before:w-0 before:h-0 before:border-l-[6px] before:border-r-[6px] before:border-b-[6px] before:border-l-transparent before:border-r-transparent before:border-b-surface-0 dark:before:border-b-surface-900 before:-translate-y-full">
                <div class="flex flex-col gap-2 p-2">
                  <div class="flex flex-col gap-1">
                    <button
                      @click="goToProfile"
                      class="flex items-center gap-3 px-3 py-2 text-left text-surface-700 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-700 rounded-lg transition-colors cursor-pointer"
                    >
                      <i class="pi pi-user text-lg"></i>
                      <span>{{ t('profile') }}</span>
                    </button>
                    
                    <button
                      @click="goToSettings"
                      class="flex items-center gap-3 px-3 py-2 text-left text-surface-700 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-700 rounded-lg transition-colors cursor-pointer"
                    >
                      <i class="pi pi-cog text-lg"></i>
                      <span>{{ t('settings') }}</span>
                    </button>

                    <button
                      @click="handleLogout"
                      class="flex items-center gap-3 px-3 py-2 text-left text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors cursor-pointer"
                    >
                      <i class="pi pi-sign-out text-lg"></i>
                      <span>{{ t('logout') }}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </slot>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { useAuth, type User } from '../composables/useAuth'
import { useLayout } from '../composables/use-layout'
import { t } from '../composables/useI18n'
import { useUserEvents } from '../composables/useUserEvents'

// Props
interface Props {
  showWelcomeTitle?: boolean
  scrollThreshold?: number
  isScrolled?: boolean
  welcomeTitle?: string
  welcomeSubtitle?: string
  showBorder?: boolean
  backgroundType?: 'transparent' | 'solid'
}

const props = withDefaults(defineProps<Props>(), {
  showWelcomeTitle: false,
  scrollThreshold: 100,
  isScrolled: false,
  welcomeTitle: '',
  welcomeSubtitle: '',
  showBorder: true,
  backgroundType: 'transparent'
})

// Emits
const emit = defineEmits<{
  openSearch: []
}>()

// 认证相关
const { getUser, getUserAvatar, getUserDisplayName, logout } = useAuth()

// 布局相关
const { themeMode, setThemeMode, isDarkMode } = useLayout()

// 用户事件监听
const { userEventBus } = useUserEvents()

// 状态
const showUserMenu = ref(false)
const currentUser = ref<User | null>(null)

// 刷新用户数据
const refreshUserData = () => {
  currentUser.value = getUser()
}

// 计算属性
const backgroundClasses = computed(() => {
  if (props.backgroundType === 'solid') {
    return 'bg-surface-0/95 dark:bg-surface-950/95 backdrop-blur-lg shadow-sm'
  }
  if (props.isScrolled) {
    return 'bg-surface-0/95 dark:bg-surface-950/95 backdrop-blur-lg shadow-sm'
  }
  return 'bg-transparent'
})

const borderClasses = computed(() => {
  if (props.showBorder && props.isScrolled) {
    return 'border-b border-surface-200 dark:border-surface-700'
  }
  return ''
})

// 方法
const toggleDarkMode = () => {
  setThemeMode(isDarkMode.value ? 'light' : 'dark')
}

const toggleUserMenu = () => {
  showUserMenu.value = !showUserMenu.value
}



const handleAvatarError = (event: Event) => {
  const img = event.target as HTMLImageElement
  // 隐藏图片，让SVG头像显示
  img.style.display = 'none'
  // 将头像字段置空以触发回退到默认头像
  if (currentUser.value) {
    currentUser.value.avatar = '' as any
  }
}

const goToProfile = () => {
  showUserMenu.value = false
  navigateTo('/profile')
}

const goToSettings = () => {
  showUserMenu.value = false
  navigateTo('/settings')
}

const handleLogout = async () => {
  showUserMenu.value = false
  
  try {
    await $fetch('/api/auth/logout', { method: 'POST' })
  } catch (error) {
    console.error('注销失败:', error)
  }
  
  logout()
}

// 监听点击外部关闭菜单
const closeMenuOnClickOutside = (event: Event) => {
  const target = event.target as Element
  if (!target.closest('.user-menu')) {
    showUserMenu.value = false
  }
}

// 暴露方法给父组件
defineExpose({
  refreshUserData
})

// 生命周期
onMounted(() => {
  currentUser.value = getUser()
  document.addEventListener('click', closeMenuOnClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', closeMenuOnClickOutside)
})

// 监听用户状态变化
watch(() => getUser(), (newUser) => {
  currentUser.value = newUser
})

// 监听用户事件
watch(userEventBus, (event) => {
  if (event) {
    // 当收到用户事件时，刷新用户数据
    currentUser.value = getUser()
  }
})
</script> 