<template>
  <div class="relative notification-bell-container">
    <button
      @click.stop="toggleNotifications"
      class="p-2 text-white hover:text-white transition-colors relative mix-blend-difference"
      :title="t('notifications')"
    >
      <i class="pi pi-bell text-lg"></i>
      <span
        v-if="hasUnread"
        class="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center"
      >
        {{ unreadCount > 99 ? '99+' : unreadCount }}
      </span>
    </button>

    <!-- 通知列表弹窗 -->
    <div
      v-if="showNotifications"
      class="absolute top-full right-0 mt-2 w-96 max-h-[600px] bg-surface-0 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-lg shadow-xl z-50 flex flex-col"
    >
      <!-- 头部 -->
      <div class="flex items-center justify-between p-4 border-b border-surface-200 dark:border-surface-700">
        <h3 class="text-lg font-semibold text-surface-900 dark:text-surface-0">
          {{ t('notifications') }}
        </h3>
        <div class="flex items-center gap-2">
          <button
            v-if="hasUnread"
            @click="handleMarkAllAsRead"
            class="text-sm text-primary hover:text-primary/80 transition-colors"
            :disabled="loading"
          >
            {{ t('mark_all_as_read') }}
          </button>
          <button
            @click="toggleNotifications"
            class="p-1 text-surface-600 dark:text-surface-400 hover:text-surface-900 dark:hover:text-surface-0 transition-colors"
          >
            <i class="pi pi-times text-sm"></i>
          </button>
        </div>
      </div>

      <!-- 通知列表 -->
      <div class="flex-1 overflow-y-auto">
        <div v-if="loading && notifications.length === 0" class="p-8 text-center">
          <i class="pi pi-spin pi-spinner text-2xl text-surface-400"></i>
          <p class="mt-2 text-sm text-surface-500">{{ t('loading') }}</p>
        </div>

        <div v-else-if="notifications.length === 0" class="p-8 text-center">
          <i class="pi pi-bell-slash text-3xl text-surface-400 mb-2"></i>
          <p class="text-sm text-surface-500">{{ t('no_notifications') }}</p>
        </div>

        <div v-else class="divide-y divide-surface-200 dark:divide-surface-700">
          <div
            v-for="notification in notifications"
            :key="notification.id"
            @click="handleNotificationClick(notification)"
            :class="[
              'p-4 cursor-pointer transition-colors',
              notification.is_read
                ? 'bg-surface-0 dark:bg-surface-900 hover:bg-surface-50 dark:hover:bg-surface-800'
                : 'bg-primary/5 dark:bg-primary/10 hover:bg-primary/10 dark:hover:bg-primary/20'
            ]"
          >
            <div class="flex items-start gap-3">
              <div
                :class="[
                  'w-2 h-2 rounded-full mt-2 flex-shrink-0',
                  notification.is_read ? 'bg-transparent' : 'bg-primary'
                ]"
              ></div>
              <div class="flex-1 min-w-0">
                <h4 class="font-medium text-surface-900 dark:text-surface-0 mb-1">
                  {{ notification.title }}
                </h4>
                <p class="text-sm text-surface-600 dark:text-surface-400 line-clamp-2">
                  {{ notification.content }}
                </p>
                <p class="text-xs text-surface-500 dark:text-surface-500 mt-2">
                  {{ formatTime(notification.created_at) }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 底部 -->
      <div
        v-if="hasMore"
        class="p-3 border-t border-surface-200 dark:border-surface-700 text-center"
      >
        <button
          @click="handleLoadMore"
          class="text-sm text-primary hover:text-primary/80 transition-colors"
          :disabled="loading"
        >
          {{ t('load_more') }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useNotifications } from '../composables/useNotifications'
import { t } from '../composables/useI18n'
import type { Notification } from '../composables/useMoviCloudAPI'

const {
  notifications: allNotifications,
  unreadCount,
  loading,
  hasUnread,
  hasMore,
  pagination,
  fetchNotifications,
  markAsRead,
  markAllAsRead
} = useNotifications()

const showNotifications = ref(false)

// 只显示未读通知
const notifications = computed(() => {
  return allNotifications.value.filter(n => !n.is_read)
})

// 切换通知列表显示
const toggleNotifications = () => {
  showNotifications.value = !showNotifications.value
  if (showNotifications.value && allNotifications.value.length === 0) {
    // 只获取未读通知
    fetchNotifications({ page: 1, is_read: false })
  }
}

// 处理通知点击
const handleNotificationClick = async (notification: Notification) => {
  // 如果未读，标记为已读
  if (!notification.is_read) {
    try {
      await markAsRead(notification.id)
      // 计算属性会自动过滤掉已读通知，无需手动移除
    } catch (error) {
      console.error('标记通知为已读失败:', error)
    }
  }
  
  // 点击后关闭弹窗
  showNotifications.value = false
}

// 标记所有为已读
const handleMarkAllAsRead = async () => {
  try {
    await markAllAsRead()
    // 计算属性会自动过滤掉已读通知，列表会自动清空
  } catch (error) {
    console.error('标记所有通知为已读失败:', error)
  }
}

// 加载更多
const handleLoadMore = async () => {
  // 加载更多时也只加载未读通知
  await fetchNotifications({ 
    page: pagination.value.page + 1,
    is_read: false,
    append: true 
  })
}

// 格式化时间
const formatTime = (dateString: string) => {
  const date = new Date(dateString)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return t('just_now')
  if (minutes < 60) return `${minutes}${t('minutes_ago')}`
  if (hours < 24) return `${hours}${t('hours_ago')}`
  if (days < 7) return `${days}${t('days_ago')}`
  
  return date.toLocaleDateString()
}

// 点击外部关闭
const handleClickOutside = (event: Event) => {
  const target = event.target as Element
  if (!target.closest('.notification-bell-container')) {
    showNotifications.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

