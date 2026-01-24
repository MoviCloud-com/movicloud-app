import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useMoviCloudAPI, type Notification, type NotificationListResponse } from './useMoviCloudAPI'
import { useDev } from './useDev'

export const useNotifications = () => {
  const { getNotifications, getUnreadNotificationCount, markNotificationAsRead, markAllNotificationsAsRead } = useMoviCloudAPI()
  const { error: devError } = useDev()

  // 状态
  const notifications = ref<Notification[]>([])
  const unreadCount = ref(0)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const pagination = ref({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  })

  // 轮询间隔（30秒）
  let pollInterval: ReturnType<typeof setInterval> | null = null
  const POLL_INTERVAL = 30000

  // 获取通知列表
  const fetchNotifications = async (params?: {
    page?: number
    limit?: number
    type?: string
    is_read?: boolean
    append?: boolean
  }) => {
    loading.value = true
    error.value = null

    try {
      const response: NotificationListResponse = await getNotifications({
        page: params?.page || pagination.value.page,
        limit: params?.limit || pagination.value.limit,
        type: params?.type,
        is_read: params?.is_read
      })

      // 如果指定了只获取未读通知，在前端再次过滤
      let filteredNotifications = response.notifications
      if (params?.is_read === false) {
        filteredNotifications = response.notifications.filter(n => !n.is_read)
      }

      if (params?.append) {
        notifications.value = [...notifications.value, ...filteredNotifications]
      } else {
        notifications.value = filteredNotifications
      }

      // 更新分页信息（基于过滤后的数量）
      pagination.value = {
        ...response.pagination,
        total: params?.is_read === false 
          ? filteredNotifications.length 
          : response.pagination.total
      }
    } catch (err: any) {
      error.value = err.message || '获取通知失败'
      devError('获取通知失败:', err)
    } finally {
      loading.value = false
    }
  }

  // 获取未读数量
  const fetchUnreadCount = async () => {
    try {
      const response = await getUnreadNotificationCount()
      unreadCount.value = response.unread_count
    } catch (err: any) {
      devError('获取未读通知数量失败:', err)
    }
  }

  // 标记通知为已读
  const markAsRead = async (notificationId: string) => {
    try {
      await markNotificationAsRead(notificationId)
      
      // 更新本地状态
      const notification = notifications.value.find(n => n.id === notificationId)
      if (notification) {
        notification.is_read = true
        notification.read_at = new Date().toISOString()
        if (unreadCount.value > 0) {
          unreadCount.value--
        }
      }
    } catch (err: any) {
      devError('标记通知为已读失败:', err)
      throw err
    }
  }

  // 标记所有通知为已读
  const markAllAsRead = async () => {
    try {
      await markAllNotificationsAsRead()
      
      // 更新本地状态
      notifications.value.forEach(notification => {
        notification.is_read = true
        notification.read_at = new Date().toISOString()
      })
      unreadCount.value = 0
    } catch (err: any) {
      devError('标记所有通知为已读失败:', err)
      throw err
    }
  }

  // 加载更多通知
  const loadMore = async () => {
    if (pagination.value.page >= pagination.value.pages || loading.value) {
      return
    }

    await fetchNotifications({
      page: pagination.value.page + 1,
      append: true
    })
  }

  // 开始轮询
  const startPolling = () => {
    if (pollInterval) return

    pollInterval = setInterval(() => {
      fetchUnreadCount()
      // 如果当前在通知列表页面，也刷新列表
      if (notifications.value.length > 0) {
        fetchNotifications({ page: 1 })
      }
    }, POLL_INTERVAL)
  }

  // 停止轮询
  const stopPolling = () => {
    if (pollInterval) {
      clearInterval(pollInterval)
      pollInterval = null
    }
  }

  // 刷新所有数据
  const refresh = async () => {
    await Promise.all([
      fetchNotifications({ page: 1 }),
      fetchUnreadCount()
    ])
  }

  // 计算属性
  const hasUnread = computed(() => unreadCount.value > 0)
  const hasMore = computed(() => pagination.value.page < pagination.value.pages)
  const unreadNotifications = computed(() => 
    notifications.value.filter(n => !n.is_read)
  )

  // 生命周期
  onMounted(() => {
    fetchUnreadCount()
    startPolling()
  })

  onUnmounted(() => {
    stopPolling()
  })

  return {
    // 状态
    notifications,
    unreadCount,
    loading,
    error,
    pagination,
    
    // 计算属性
    hasUnread,
    hasMore,
    unreadNotifications,
    
    // 方法
    fetchNotifications,
    fetchUnreadCount,
    markAsRead,
    markAllAsRead,
    loadMore,
    refresh,
    startPolling,
    stopPolling
  }
}

