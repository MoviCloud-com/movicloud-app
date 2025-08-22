export default defineNuxtPlugin(async () => {
  const store = useLayoutStore()
  
  // 从 localStorage 恢复状态并初始化主题
  await store.initializeFromStorage()
  
  // 监听状态变化并自动保存
  store.$subscribe(() => {
    store.saveToStorage()
  })
})