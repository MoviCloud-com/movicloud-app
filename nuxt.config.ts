import { fileURLToPath } from 'node:url';
import tailwindcss from '@tailwindcss/vite';

export default defineNuxtConfig({
  compatibilityDate: "2024-11-01",
  devtools: { enabled: true },
  
  // 关闭 SSR，纯客户端渲染
  ssr: false,
  
  // 开发服务器配置
  devServer: {
    port: 25081
  },
  
  css: ["~/assets/css/main.css"],
  
  vite: {
    plugins: [tailwindcss()],
  },
  
  postcss: {
    plugins: {
      '@tailwindcss/postcss': {},
    },
  },
  
  alias: {
    '~/types': fileURLToPath(new URL('./types', import.meta.url)),
    '@/types': fileURLToPath(new URL('./types', import.meta.url))
  },
  
  modules: [
    '@pinia/nuxt'
    // 移除 @pinia-plugin-persistedstate/nuxt，手动管理更简单
  ],
  
  nitro: {
    // 服务器配置
    experimental: {
      wasm: true
    },
    // 静态文件服务配置
    routeRules: {
      '/uploads/**': {
        headers: {
          'cache-control': 'public, max-age=31536000, immutable'
        }
      }
    },
    // 复制数据库相关文件到 .output 目录
    hooks: {
      'build:before': () => {
        if (process.env.NODE_ENV === 'development') {
          console.log('构建前复制数据库文件...')
        }
      }
    }
  },
  
  pinia: {
    storesDirs: ['./stores/**']
  }
})
