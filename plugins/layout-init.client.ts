export default defineNuxtPlugin(async () => {
  const store = useLayoutStore()
  
  await store.initializeFromStorage()
})
