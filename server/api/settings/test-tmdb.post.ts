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

    // 测试TMDB API连接
    const baseUrl = inputBaseUrl || 'https://api.tmdb.org'
    const testUrl = `${baseUrl}/3`
    const testEndpoint = `${testUrl}/configuration?api_key=${apiKey}`
    
    try {
      devLog('🔍 测试TMDB API连接:', testEndpoint)

      const response = await fetch(testEndpoint, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'MoviCloud/1.0'
        },
        signal: AbortSignal.timeout(15000)
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
    } catch (error: any) {
      devError('❌ TMDB API测试失败:', error.message)
      
      let errorMessage = 'API连接测试失败'
      if (error.message.includes('fetch')) {
        errorMessage = '网络连接失败，请检查网络设置'
      } else if (error.message.includes('timeout')) {
        errorMessage = '连接超时，请检查网络连接'
      } else if (error.message.includes('Connection refused')) {
        errorMessage = '连接被拒绝，请检查网络设置'
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