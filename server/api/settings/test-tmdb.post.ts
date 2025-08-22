import { dbManager } from '../../database/database'
import { devLog, devError } from '../../utils/dev'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const { apiKey, apiBaseUrl: inputBaseUrl } = body

    if (!apiKey) {
      return {
        success: false,
        message: 'API Key不能为空'
      }
    }

    // 从数据库获取代理配置
    const proxyEnabled = await dbManager.getSetting('proxy_enabled')
    const httpProxy = await dbManager.getSetting('http_proxy')
    const httpsProxy = await dbManager.getSetting('https_proxy')
    const allProxy = await dbManager.getSetting('all_proxy')

    // 测试TMDB API连接
    const baseUrl = inputBaseUrl || 'https://api.tmdb.org'
    const testUrl = `${baseUrl}/3`
    const testEndpoint = `${testUrl}/configuration?api_key=${apiKey}`
    
    try {
      devLog('🔍 测试TMDB API连接:', testEndpoint)
      devLog('代理配置:', { proxyEnabled, httpProxy, httpsProxy, allProxy })
      
      // 如果启用了代理，使用fetch进行测试
      if (proxyEnabled === '1' && (httpProxy || httpsProxy || allProxy)) {
        devLog('🔄 使用代理测试TMDB API')
        const { HttpsProxyAgent } = await import('https-proxy-agent')
        
        const proxyToUse = httpProxy || httpsProxy || allProxy
        
        if (!proxyToUse) {
          return {
            success: false,
            message: '代理配置不完整，请检查代理设置',
            error: 'Missing proxy configuration'
          }
        }
        
        // 验证代理格式
        if (!proxyToUse.match(/^(http|https|socks5):\/\/[\w\-\.]+:\d+$/)) {
          return {
            success: false,
            message: '代理地址格式不正确，应为 http://host:port 或 https://host:port 或 socks5://host:port',
            error: 'Invalid proxy format'
          }
        }
        
        // 准备fetch选项
        const fetchOptions: RequestInit = {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          }
        }
        
        // 配置代理
        if (proxyToUse.startsWith('https://') || proxyToUse.startsWith('http://')) {
          const agent = new HttpsProxyAgent(proxyToUse)
          // @ts-ignore - Node.js 18+ 支持
          fetchOptions.agent = agent
        } else if (proxyToUse.startsWith('socks5://')) {
          devLog('警告: 暂不支持socks5代理，将使用直接连接')
        }
        
        devLog('🌐 执行代理fetch请求')
        
        const response = await fetch(testEndpoint, fetchOptions)
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }
        
        const responseData = await response.json()
        devLog('✅ 代理fetch测试成功，返回数据:', responseData)
        
        if (responseData.status_code === 7) {
          return {
            success: true,
            message: 'API连接测试成功（API Key无效，但网络连接正常）',
            data: {
              baseUrl: 'https://image.tmdb.org/t/p',
              secureBaseUrl: 'https://image.tmdb.org/t/p'
            }
          }
        } else if (responseData.images && responseData.images.base_url) {
          return {
            success: true,
            message: 'API连接测试成功',
            data: {
              baseUrl: responseData.images.base_url,
              secureBaseUrl: responseData.images.secure_base_url
            }
          }
        } else {
          return {
            success: true,
            message: 'API连接测试成功（网络连接正常）',
            data: {
              baseUrl: 'https://image.tmdb.org/t/p',
              secureBaseUrl: 'https://image.tmdb.org/t/p'
            }
          }
        }
      } else {
        // 直接访问TMDB API
        devLog('🌐 直接访问TMDB API')
        devLog('测试URL:', testEndpoint)
        
        const response = await fetch(testEndpoint, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'MoviCloud/1.0'
          },
          signal: AbortSignal.timeout(15000) // 15秒超时
        })
        
        devLog('响应状态:', response.status, response.statusText)
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`)
        }
        
        const data = await response.json()
        devLog('✅ 直接访问成功，返回数据:', data)
        
        if (data.status_code === 7) {
          return {
            success: true,
            message: 'API连接测试成功（API Key无效，但网络连接正常）',
            data: {
              baseUrl: 'https://image.tmdb.org/t/p',
              secureBaseUrl: 'https://image.tmdb.org/t/p'
            }
          }
        } else if (data.images && data.images.base_url) {
          return {
            success: true,
            message: 'API连接测试成功',
            data: {
              baseUrl: data.images.base_url,
              secureBaseUrl: data.images.secure_base_url
            }
          }
        } else {
          return {
            success: true,
            message: 'API连接测试成功（网络连接正常）',
            data: {
              baseUrl: 'https://image.tmdb.org/t/p',
              secureBaseUrl: 'https://image.tmdb.org/t/p'
            }
          }
        }
      }
    } catch (error: any) {
      devError('❌ TMDB API测试失败:', error.message)
      
      // 提供更详细的错误信息
      let errorMessage = 'API连接测试失败'
      if (error.message.includes('fetch')) {
        errorMessage = '网络连接失败，请检查网络设置'
      } else if (error.message.includes('timeout')) {
        errorMessage = '连接超时，请检查网络连接'
      } else if (error.message.includes('Connection refused')) {
        errorMessage = '连接被拒绝，请检查代理设置'
      } else if (error.message.includes('Could not resolve host')) {
        errorMessage = '无法解析主机地址，请检查网络设置'
      }
      
      return {
        success: false,
        message: errorMessage,
        error: error.message
      }
    }
  } catch (error: any) {
    devError('TMDB API测试失败:', error)
    return {
      success: false,
      message: 'API连接测试失败，请检查网络连接和API Key',
      error: error.message
    }
  }
}) 