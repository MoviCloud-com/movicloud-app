import { ref, readonly } from 'vue'

// 用户事件类型
export type UserEventType = 'profile_updated' | 'avatar_updated'

// 用户事件总线
const userEventBus = ref<{
  type: UserEventType
  data?: any
} | null>(null)

// 触发用户事件
export const triggerUserEvent = (type: UserEventType, data?: any) => {
  userEventBus.value = { type, data }
}

// 监听用户事件
export const useUserEvents = () => {
  return {
    userEventBus: readonly(userEventBus),
    triggerUserEvent
  }
} 