import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'movicloud-secret-key'

import { devLog } from '../utils/dev'

export default defineEventHandler(async (event) => {
  // 跳过不需要认证的路由
  const url = getRequestURL(event)
  const publicRoutes = ['/login', '/install-status', '/debug', '/api/install', '/api/auth/login', '/api/network', '/api/debug', '/api/settings/tmdb', '/api/settings/language', '/api/test-proxy', '/api/tmdb/config', '/api/tmdb']
  
  // 允许访问静态资源
  const isStaticResource = url.pathname.startsWith('/assets/') || 
                          url.pathname.startsWith('/_nuxt/') ||
                          url.pathname.startsWith('/favicon.ico') ||
                          url.pathname.endsWith('.png') ||
                          url.pathname.endsWith('.jpg') ||
                          url.pathname.endsWith('.jpeg') ||
                          url.pathname.endsWith('.gif') ||
                          url.pathname.endsWith('.svg') ||
                          url.pathname.endsWith('.ico') ||
                          url.pathname.endsWith('.css') ||
                          url.pathname.endsWith('.js')
  
  // 特殊处理 install 路由
  if (url.pathname === '/install') {
    try {
      const { dbManager } = await import('../database/database')
      const isInstalled = await dbManager.isInstalled()
      
      if (isInstalled) {
        return sendRedirect(event, '/login', 302)
      } else {
        return
      }
    } catch (error) {
      return
    }
  }
  
  const isPublicRoute = publicRoutes.some(route => 
    url.pathname.startsWith(route)
  )
  
  if (isPublicRoute || isStaticResource) {
    return
  }

  // 检查是否已安装
  try {
    const { dbManager } = await import('../database/database')
    const isInstalled = await dbManager.isInstalled()
    
    if (!isInstalled) {
      return sendRedirect(event, '/install', 302)
    }
  } catch (error) {
    // 如果数据库未初始化，允许访问安装页面
    if (url.pathname === '/install') {
      return
    }
    return sendRedirect(event, '/install', 302)
  }

  // 获取Authorization头
  const authHeader = getHeader(event, 'authorization')
  const token = authHeader?.replace('Bearer ', '') || getCookie(event, 'token')

  if (!token) {
    // 如果是API请求，返回401
    if (url.pathname.startsWith('/api/')) {
      throw createError({
        statusCode: 401,
        statusMessage: 'unauthorized'
      })
    }
    return sendRedirect(event, '/login', 302)
  }

  try {
    // 验证JWT token
    const decoded = jwt.verify(token, JWT_SECRET) as any
    
    // 将用户信息添加到请求上下文
    event.context.user = {
      userId: decoded.userId,
      username: decoded.username,
      role: decoded.role
    }
  } catch (error) {
    
    // 清除无效的token
    setCookie(event, 'token', '', { maxAge: 0 })
    
    // 如果是API请求，返回401
    if (url.pathname.startsWith('/api/')) {
      throw createError({
        statusCode: 401,
        statusMessage: 'token_expired_or_invalid'
      })
    }
    // 否则重定向到登录页面
    return sendRedirect(event, '/login', 302)
  }
}) 