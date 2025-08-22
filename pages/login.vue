<template>
  <SimpleLayout>
    <div class="min-h-screen bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center p-4">
    <div class="w-full max-w-md">
      <!-- Logo和标题 -->
      <div class="text-center mb-8">
        <div class="flex justify-center mb-4">
          <svg
            width="80"
            height="80"
            viewBox="5 4 27 22"
            fill="none"
            class="text-white"
            xmlns="http://www.w3.org/2000/svg"
          >
            <!-- 云朵背景 -->
            <path
              d="M26.5 12C26.5 8.41 23.59 5.5 20 5.5C17.24 5.5 14.91 7.34 14.21 9.9C13.8 9.8 13.4 9.75 13 9.75C10.24 9.75 8 11.99 8 14.75C8 15.44 8.15 16.09 8.42 16.67C6.97 17.54 6 19.15 6 21C6 23.76 8.24 26 11 26H26C28.76 26 31 23.76 31 21C31 18.79 29.79 16.88 28 16.25C27.84 13.94 27.42 12 26.5 12Z"
              class="fill-white/20"
            />
            
            <!-- 胶片卷轴 -->
            <rect x="10" y="13" width="16" height="11" rx="1" class="fill-white" />
            
            <!-- 胶片孔 -->
            <circle cx="12" cy="15.5" r="0.8" class="fill-primary-500" />
            <circle cx="12" cy="18.5" r="0.8" class="fill-primary-500" />
            <circle cx="12" cy="21.5" r="0.8" class="fill-primary-500" />
            
            <circle cx="23" cy="15.5" r="0.8" class="fill-primary-500" />
            <circle cx="23" cy="18.5" r="0.8" class="fill-primary-500" />
            <circle cx="23" cy="21.5" r="0.8" class="fill-primary-500" />
            
            <!-- 播放按钮 -->
            <circle cx="17.5" cy="19" r="3" class="fill-primary-500" />
            <path
              d="M16.5 17L19.5 19L16.5 21V17Z"
              class="fill-white"
            />
          </svg>
        </div>
        <h1 class="text-4xl font-bold text-white mb-2">MoviCloud</h1>
        <p class="text-white/80 text-lg">{{ t('installation_subtitle') }}</p>
      </div>

      <!-- 登录表单 -->
      <div class="bg-white dark:bg-surface-900 rounded-xl shadow-2xl p-8">
        <h2 class="text-2xl font-bold text-surface-900 dark:text-surface-100 mb-6 text-center">{{ t('login_title') }}</h2>
        
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">{{ t('username_label') }}</label>
            <input
              v-model="formData.username"
              type="text"
              :placeholder="t('username_placeholder')"
              class="w-full px-4 py-3 border border-surface-300 dark:border-surface-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-surface-50 dark:bg-surface-800 text-surface-900 dark:text-surface-100"
            />
          </div>
          
          <div>
            <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">{{ t('password_label') }}</label>
            <input
              v-model="formData.password"
              type="password"
              :placeholder="t('password_placeholder')"
              class="w-full px-4 py-3 border border-surface-300 dark:border-surface-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-surface-50 dark:bg-surface-800 text-surface-900 dark:text-surface-100"
            />
          </div>
          
          <button
            @click="handleLogin"
            :disabled="loading"
            class="w-full px-6 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <i v-if="loading" class="pi pi-spin pi-spinner mr-2"></i>
            {{ loading ? t('loading') : t('login_button') }}
          </button>
        </div>

        <div class="mt-6 text-center">
          <p class="text-sm text-surface-600 dark:text-surface-400">
            还没有账户？请联系管理员创建账户
          </p>
        </div>
      </div>
    </div>
  </div>
  </SimpleLayout>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()

// 表单数据
const formData = ref({
  username: '',
  password: ''
})

// 状态
const loading = ref(false)
const error = ref('')

// 处理登录
const handleLogin = async () => {
  if (!formData.value.username || !formData.value.password) {
    error.value = '请填写用户名和密码'
    return
  }

  loading.value = true
  error.value = ''

  try {
    const response = await $fetch<{
      success: boolean
      message: string
      data?: {
        user: any
        token: string
      }
    }>('/api/auth/login', {
      method: 'POST',
      body: {
        username: formData.value.username,
        password: formData.value.password
      }
    })

    if (response.success && response.data) {
      // 保存用户信息和token
      localStorage.setItem('user', JSON.stringify(response.data.user))
      localStorage.setItem('token', response.data.token)
      
      // 跳转到首页
      router.push('/')
    } else {
      error.value = response.message || '登录失败'
    }
  } catch (err) {
    error.value = '网络错误，请重试'
  } finally {
    loading.value = false
  }
}

// 设置页面标题
useHead({
  title: '用户登录 - MoviCloud',
  meta: [
    { name: 'description', content: 'MoviCloud 用户登录' }
  ]
})
</script> 