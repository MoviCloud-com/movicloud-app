export default defineNuxtPlugin(async () => {
  const { isLoggedIn, isTokenValid, logout } = useAuth()
  const router = useRouter()
  const { log, error: devError } = useDev()

  // 检查认证状态
  const checkAuth = () => {
    
    // 如果已经在登录页面，不需要检查
    if (router.currentRoute.value.path === '/login') {

      return
    }
    
    if (!isLoggedIn() || !isTokenValid()) {

      // 清除无效的认证信息
      localStorage.removeItem('user')
      localStorage.removeItem('token')
      
      // 如果不在登录页面，重定向到登录页面
      if (router.currentRoute.value.path !== '/login') {

        router.push('/login')
      }
    } else {
      
    }
  }

  // 等待路由准备就绪
  await router.isReady()

  // 监听路由变化
  router.beforeEach(async (to, from, next) => {
    
    // 跳过不需要认证的路由
    const publicRoutes = ['/login', '/install-status', '/debug', '/network-test']
    
    // 特殊处理 install 路由
    if (to.path === '/install') {
      try {
        const response = await $fetch<{
          success: boolean
          isInstalled: boolean
          message: string
        }>('/api/install/check')
        
        if (response.success && response.isInstalled) {
          return next('/login')
        } else {
          return next()
        }
      } catch (error) {
        // 如果检查失败，允许访问安装页面
        return next()
      }
    }
    
    if (publicRoutes.includes(to.path)) {
      return next()
    }

    // 检查认证状态
    const isLoggedInStatus = isLoggedIn()
    const isTokenValidStatus = isTokenValid()
    
    if (!isLoggedInStatus || !isTokenValidStatus) {
      if (to.path !== '/login') {
        return next('/login')
      }
    }
    next()
  })

  // 定期检查token有效性（每分钟检查一次）
  setInterval(checkAuth, 60000)
}) 