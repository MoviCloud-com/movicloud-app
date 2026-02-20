<template>
  <div class="relative user-avatar-menu">
    <!-- 头像按钮 -->
    <div
      class="w-10 h-10 rounded-full border-2 border-surface-300 dark:border-white/30 cursor-pointer hover:opacity-80 transition-opacity overflow-hidden flex items-center justify-center"
      @click="toggleMenu"
    >
      <img
        v-if="user?.avatar"
        :src="user?.avatar"
        :alt="user?.name || user?.username"
        class="w-full h-full object-cover"
        @error="handleAvatarError"
      />
      <UserAvatar v-else :size="32" />
    </div>
    
    <!-- 下拉菜单 -->
    <div v-if="showMenu" class="absolute top-full right-0 mt-2 w-48 bg-surface-0 dark:bg-surface-900 text-surface-700 dark:text-surface-0 border border-surface-200 dark:border-surface-700 rounded-md shadow-lg z-50 before:absolute before:top-0 before:right-2 before:w-0 before:h-0 before:border-l-[6px] before:border-r-[6px] before:border-b-[6px] before:border-l-transparent before:border-r-transparent before:border-b-surface-0 dark:before:border-b-surface-900 before:-translate-y-full">
      <div class="flex flex-col gap-2 p-2">
        <button
          @click="$emit('profile')"
          class="flex items-center gap-3 px-3 py-2 text-left text-surface-700 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-700 rounded-lg transition-colors cursor-pointer"
        >
          <i class="pi pi-user text-lg"></i>
          <span>{{ t('profile') }}</span>
        </button>
        
        <button
          @click="$emit('applications')"
          class="flex items-center gap-3 px-3 py-2 text-left text-surface-700 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-700 rounded-lg transition-colors cursor-pointer"
        >
          <i class="pi pi-file text-lg"></i>
          <span>{{ t('my_applications') }}</span>
        </button>

        <button
          @click="$emit('subscriptions')"
          class="flex items-center gap-3 px-3 py-2 text-left text-surface-700 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-700 rounded-lg transition-colors cursor-pointer"
        >
          <i class="pi pi-heart text-lg"></i>
          <span>{{ t('my_subscriptions') }}</span>
        </button>

        <button
          @click="$emit('resources')"
          class="flex items-center gap-3 px-3 py-2 text-left text-surface-700 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-700 rounded-lg transition-colors cursor-pointer"
        >
          <i class="pi pi-database text-lg"></i>
          <span>{{ t('my_resources') }}</span>
        </button>
        
        <button
          @click="$emit('settings')"
          class="flex items-center gap-3 px-3 py-2 text-left text-surface-700 dark:text-surface-300 hover:bg-surface-100 dark:hover:bg-surface-700 rounded-lg transition-colors cursor-pointer"
        >
          <i class="pi pi-cog text-lg"></i>
          <span>{{ t('settings') }}</span>
        </button>

        <button
          @click="$emit('logout')"
          class="flex items-center gap-3 px-3 py-2 text-left text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors cursor-pointer"
        >
          <i class="pi pi-sign-out text-lg"></i>
          <span>{{ t('logout') }}</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { t } from '../composables/useI18n'
import UserAvatar from './UserAvatar.vue'

interface User {
  id?: string
  name?: string
  username?: string
  avatar?: string
  role?: string
}

interface Props {
  user?: User | null
}

const props = withDefaults(defineProps<Props>(), {
  user: null
})

const emit = defineEmits<{
  profile: []
  applications: []
  subscriptions: []
  resources: []
  settings: []
  logout: []
}>()

const showMenu = ref(false)

const toggleMenu = () => {
  showMenu.value = !showMenu.value
}

const handleAvatarError = (event: Event) => {
  const img = event.target as HTMLImageElement
  img.style.display = 'none'
}

const closeMenuOnClickOutside = (event: Event) => {
  const target = event.target as Element
  if (!target.closest('.user-avatar-menu')) {
    showMenu.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', closeMenuOnClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', closeMenuOnClickOutside)
})

</script>

<style scoped>
.user-avatar-menu {
  position: relative;
}
</style>