import { configManager } from '../utils/config-manager'
import { devError } from '../utils/dev'

export default defineEventHandler(async (event) => {
  // 跳过安装相关的路由和静态资源
  const url = getRequestURL(event)
  if (
    url.pathname.startsWith('/api/install') || 
    url.pathname === '/install' ||
    url.pathname.startsWith('/_nuxt/') ||
    url.pathname.startsWith('/api/_nuxt_icon/') ||
    url.pathname === '/favicon.ico' ||
    url.pathname.startsWith('/uploads/') // 允许访问上传的图片
  ) {
    return
  }

  try {
    const isInstalled = configManager.isInstalled()
    
    // 如果未安装且不是安装页面，重定向到安装页面
    if (!isInstalled && url.pathname !== '/install') {
      return sendRedirect(event, '/install', 302)
    }
    
    // 如果已安装且访问安装页面，重定向到首页
    if (isInstalled && url.pathname === '/install') {
      return sendRedirect(event, '/', 302)
    }
  } catch (error) {
    devError('检查安装状态失败:', error)
    // 如果检查失败，允许访问安装页面
    if (url.pathname !== '/install') {
      return sendRedirect(event, '/install', 302)
    }
  }
}) 