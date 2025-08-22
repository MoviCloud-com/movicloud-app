// 这个插件只在服务器端运行，用于设置代理配置
export default defineNuxtPlugin(async () => {
  // 只在服务器端运行
  if (process.server) {
    const { devLog, devWarn } = await import('../server/utils/dev')
    devLog('🔧 setup-proxy 插件已加载 (服务器端)')
    
    // 动态导入服务器端包，避免在客户端打包
    import('global-agent').then(({ bootstrap }) => {
      // 检查环境变量中的代理配置
      const httpProxy = process.env.HTTP_PROXY || ''
      const httpsProxy = process.env.HTTPS_PROXY || ''
      const allProxy = process.env.ALL_PROXY || ''

  // 设置环境变量
  process.env.HTTP_PROXY = httpProxy
  process.env.HTTPS_PROXY = httpsProxy
  process.env.ALL_PROXY = allProxy

  // 只有在有代理配置时才启用 global-agent
  if (httpProxy || httpsProxy || allProxy) {
    bootstrap()
    devLog('✅ 代理已启用:', {
      http: process.env.HTTP_PROXY,
      https: process.env.HTTPS_PROXY,
      all: process.env.ALL_PROXY,
    })
  } else {
    devLog('🔧 代理未配置，使用直连')
  }
    }).catch(error => {
      devWarn('无法加载 global-agent:', error)
    })
  }
})

// 导出函数供其他地方使用（仅在服务器端）
export const setupProxy = (proxyConfig?: {
  httpProxy?: string
  httpsProxy?: string
  allProxy?: string
}) => {
  if (process.server) {
    // 动态导入服务器端包
    import('../server/utils/dev').then(({ devLog, devWarn }) => {
      import('global-agent').then(({ bootstrap }) => {
        const httpProxy = proxyConfig?.httpProxy || process.env.HTTP_PROXY || ''
        const httpsProxy = proxyConfig?.httpsProxy || process.env.HTTPS_PROXY || ''
        const allProxy = proxyConfig?.allProxy || process.env.ALL_PROXY || ''

        process.env.HTTP_PROXY = httpProxy
        process.env.HTTPS_PROXY = httpsProxy
        process.env.ALL_PROXY = allProxy

        if (httpProxy || httpsProxy || allProxy) {
          bootstrap()
          devLog('✅ 代理已启用:', {
            http: process.env.HTTP_PROXY,
            https: process.env.HTTPS_PROXY,
            all: process.env.ALL_PROXY,
          })
        }
      }).catch(error => {
        devWarn('无法加载 global-agent:', error)
      })
    })
  }
} 