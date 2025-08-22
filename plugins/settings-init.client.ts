import { useSettingsCache } from '../composables/useSettingsCache'

export default defineNuxtPlugin(async () => {
  const { initializeSettings } = useSettingsCache()
 
  // 在应用启动时初始化设置缓存
  await initializeSettings()
}) 