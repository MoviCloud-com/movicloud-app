import { dbManager } from '../database/database'
import { devError } from '../utils/dev'

export default defineEventHandler(async (event) => {
  // 跳过安装相关的路由
  const url = getRequestURL(event)
  if (url.pathname.startsWith('/api/install') || url.pathname === '/install') {
    return
  }

  try {
    const isInstalled = await dbManager.isInstalled()
    
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