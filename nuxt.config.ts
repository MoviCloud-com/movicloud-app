import { fileURLToPath } from 'node:url';
import tailwindcss from '@tailwindcss/vite';

const platform = process.env.NUXT_PUBLIC_PLATFORM || 'unknown'
const outputDir = platform !== 'unknown' ? `dist/${platform}` : '.output'

export default defineNuxtConfig({
  compatibilityDate: "2024-11-01",
  devtools: { enabled: true },
  
  ssr: false,

  runtimeConfig: {
    public: {
      platform: platform
    }
  },
  
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
    output: {
      dir: outputDir
    },
    devProxy: {
      '/movicloud-api': {
        target: 'https://api.movicloud.com',
        changeOrigin: true,
        secure: false,
      }
    },
    experimental: {
      wasm: true
    },
    routeRules: {
      '/uploads/**': {
        headers: {
          'cache-control': 'public, max-age=31536000, immutable'
        }
      }
    },
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
