import { useRouter } from 'vue-router'
import { useDev } from './useDev'

export interface User {
  id: number
  username: string
  nickname?: string
  role: 'admin' | 'user'
  email?: string
  avatar?: string
}

export const useAuth = () => {
  const router = useRouter()
  const { log, error: devError } = useDev()
  
  // 同步localStorage token到cookie
  const syncTokenToCookie = () => {
    if (process.client) {
      const token = localStorage.getItem('token')
      if (token) {
        document.cookie = `token=${token}; path=/; max-age=604800; SameSite=Lax`
      }
    }
  }
  
  // 获取当前用户
  const getUser = (): User | null => {
    if (process.client) {
      const userStr = localStorage.getItem('user')
      if (userStr) {
        try {
          return JSON.parse(userStr)
        } catch (error) {
          devError('解析用户信息失败:', error)
          return null
        }
      }
    }
    return null
  }

  // 获取token
  const getToken = (): string | null => {
    if (process.client) {
      return localStorage.getItem('token')
    }
    return null
  }

  // 检查是否已登录
  const isLoggedIn = (): boolean => {
    const user = getUser()
    const token = getToken()
    const result = !!(user && token)
    
    return result
  }

  // 检查token是否有效
  const isTokenValid = (): boolean => {
    const token = getToken()
    if (!token) {
          if (process.client) {
      log('isTokenValid: token不存在')
    }
      return false
    }

    try {
      // 解析JWT token（不验证签名，只检查格式和过期时间）
      const payload = JSON.parse(atob(token.split('.')[1]))
      const exp = payload.exp * 1000 // 转换为毫秒
      const isValid = Date.now() < exp
      
      return isValid
    } catch (error) {
      devError('Token验证失败:', error)
      return false
    }
  }

  // 登录
  const login = async (username: string, password: string) => {
    try {
      const response = await $fetch<{
        success: boolean
        message: string
        data?: {
          user: User
          token: string
        }
      }>('/api/auth/login', {
        method: 'POST',
        body: { username, password }
      })

      if (response.success && response.data) {
        localStorage.setItem('user', JSON.stringify(response.data.user))
        localStorage.setItem('token', response.data.token)
        
        // 同时设置cookie，供服务端中间件使用
        document.cookie = `token=${response.data.token}; path=/; max-age=604800; SameSite=Lax`
        
        return { success: true }
      } else {
        return { success: false, message: response.message }
      }
    } catch (error) {
      return { success: false, message: '网络错误，请重试' }
    }
  }

  // 注销
  const logout = () => {
    localStorage.removeItem('user')
    localStorage.removeItem('token')
    
    // 清除cookie
    document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'
    
    router.push('/login')
  }

  // 获取用户头像
  const getUserAvatar = (user: User | null): string => {
      if (!user) return '/images/default-avatar.png'
  return user.avatar || '/images/default-avatar.png'
  }

  // 获取用户显示名称
  const getUserDisplayName = (user: User | null): string => {
    if (!user) return '未登录'
    return user.nickname || user.username
  }

  // 检查权限
  const hasRole = (role: 'admin' | 'user'): boolean => {
    const user = getUser()
    if (!user) return false
    return user.role === role
  }

  // 检查是否为管理员
  const isAdmin = (): boolean => {
    return hasRole('admin')
  }

  return {
    getUser,
    getToken,
    isLoggedIn,
    isTokenValid,
    login,
    logout,
    getUserAvatar,
    getUserDisplayName,
    hasRole,
    isAdmin,
    syncTokenToCookie
  }
} 