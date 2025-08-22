<template>
  <SimpleLayout>
    <div class="min-h-screen flex items-center justify-center p-4">
      <div class="w-full max-w-2xl">
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

        <!-- 安装表单 -->
        <div class="bg-white dark:bg-surface-900 rounded-xl shadow-2xl p-8">
          <div v-if="currentStep === 1">
            <h2 class="text-2xl font-bold text-surface-900 dark:text-surface-100 mb-6">{{ t('welcome_install') }}</h2>
            <p class="text-surface-600 dark:text-surface-400 mb-6">
              {{ t('welcome_install_desc') }}
            </p>
            <button
              @click="currentStep = 2"
              class="w-full bg-primary-500 text-white py-3 px-6 rounded-lg hover:bg-primary-600 transition-colors"
            >
              {{ t('start_installation') }}
            </button>
          </div>

          <div v-else-if="currentStep === 2">
            <h2 class="text-2xl font-bold text-surface-900 dark:text-surface-100 mb-6">{{ t('tmdb_api_config') }}</h2>
            
            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                  {{ t('tmdb_api_key') }} *
                </label>
                <input
                  v-model="formData.tmdbApiKey"
                  type="text"
                  :placeholder="t('tmdb_api_key_placeholder')"
                  class="w-full px-4 py-3 border border-surface-300 dark:border-surface-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-surface-50 dark:bg-surface-800 text-surface-900 dark:text-surface-100"
                  @blur="testTMDBConnection"
                />
                <p class="text-xs text-surface-500 mt-1">
                  {{ t('tmdb_api_key_help') }}
                </p>
              </div>

              <div>
                <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                  {{ t('tmdb_api_base_url') }}
                </label>
                <input
                  v-model="formData.tmdbApiBaseUrl"
                  type="text"
                  :placeholder="t('tmdb_api_base_url_placeholder')"
                  class="w-full px-4 py-3 border border-surface-300 dark:border-surface-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-surface-50 dark:bg-surface-800 text-surface-900 dark:text-surface-100"
                />
                <p class="text-xs text-surface-500 mt-1">
                  {{ t('tmdb_api_base_url_help') }}
                </p>
              </div>

              <div>
                <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                  {{ t('tmdb_image_base_url') }}
                </label>
                <input
                  v-model="formData.tmdbImageBaseUrl"
                  type="text"
                  :placeholder="t('tmdb_image_base_url_placeholder')"
                  class="w-full px-4 py-3 border border-surface-300 dark:border-surface-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-surface-50 dark:bg-surface-800 text-surface-900 dark:text-surface-100"
                />
                <p class="text-xs text-surface-500 mt-1">
                  {{ t('tmdb_image_base_url_help') }}
                </p>
              </div>

              <div class="flex items-center">
                <input
                  v-model="formData.proxyEnabled"
                  type="checkbox"
                  id="proxy-enabled"
                  class="w-4 h-4 text-primary border-surface-300 rounded focus:ring-primary"
                />
                <label for="proxy-enabled" class="ml-2 text-sm text-surface-700 dark:text-surface-300">
                  {{ t('enable_proxy') }}
                </label>
              </div>

              <div v-if="formData.proxyEnabled" class="space-y-4">
                <div>
                  <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                    {{ t('http_proxy_address') }}
                  </label>
                  <input
                    v-model="formData.httpProxy"
                    type="text"
                    placeholder="http://127.0.0.1:7890"
                    class="w-full px-4 py-3 border border-surface-300 dark:border-surface-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-surface-50 dark:bg-surface-800 text-surface-900 dark:text-surface-100"
                  />
                  <p class="text-xs text-surface-500 mt-1">
                    {{ t('http_proxy_help') }}
                  </p>
                </div>

                <div>
                  <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                    {{ t('https_proxy_address') }}
                  </label>
                  <input
                    v-model="formData.httpsProxy"
                    type="text"
                    placeholder="http://127.0.0.1:7890"
                    class="w-full px-4 py-3 border border-surface-300 dark:border-surface-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-surface-50 dark:bg-surface-800 text-surface-900 dark:text-surface-100"
                  />
                  <p class="text-xs text-surface-500 mt-1">
                    {{ t('https_proxy_help') }}
                  </p>
                </div>

                <div>
                  <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                    {{ t('socks5_proxy_address') }}
                  </label>
                  <input
                    v-model="formData.allProxy"
                    type="text"
                    placeholder="socks5://127.0.0.1:7890"
                    class="w-full px-4 py-3 border border-surface-300 dark:border-surface-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-surface-50 dark:bg-surface-800 text-surface-900 dark:text-surface-100"
                  />
                  <p class="text-xs text-surface-500 mt-1">
                    {{ t('socks5_proxy_help') }}
                  </p>
                </div>

                <div>
                  <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                    {{ t('installation_general_proxy') }}
                  </label>
                  <input
                    v-model="formData.proxyUrl"
                    type="text"
                    placeholder="http://your-proxy-server.com"
                    class="w-full px-4 py-3 border border-surface-300 dark:border-surface-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-surface-50 dark:bg-surface-800 text-surface-900 dark:text-surface-100"
                  />
                  <p class="text-xs text-surface-500 mt-1">
                    {{ t('tmdb_api_base_url_help') }}
                  </p>
                </div>
              </div>

              <!-- API 连接测试结果 -->
              <div v-if="apiTestResult !== null" class="p-3 rounded-lg" :class="apiTestResult ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'">
                <div class="flex items-center">
                  <i :class="apiTestResult ? 'pi pi-check-circle' : 'pi pi-exclamation-triangle'" class="mr-2"></i>
                  <span>{{ apiTestResult ? t('api_test_success') : t('api_test_failed') }}</span>
                </div>
                <div v-if="!apiTestResult" class="mt-2 text-sm">
                  <p class="mb-2">{{ t('installation_api_test_solutions') }}</p>
                  <ul class="list-disc list-inside space-y-1 text-xs">
                    <li>{{ t('installation_check_network_connection') }}</li>
                    <li>{{ t('installation_confirm_api_key') }}</li>
                    <li>{{ t('installation_enable_proxy_settings') }}</li>
                    <li>{{ t('installation_try_different_api_base_url') }}</li>
                  </ul>
                  <div class="mt-3 space-y-2">
                    <div class="flex items-center">
                      <input
                        v-model="skipApiTest"
                        type="checkbox"
                        id="skip-api-test"
                        class="w-4 h-4 text-primary border-surface-300 rounded focus:ring-primary"
                      />
                      <label for="skip-api-test" class="ml-2 text-xs text-surface-600 dark:text-surface-400">
                        {{ t('installation_skip_api_test_continue_installation') }}
                      </label>
                    </div>
                  </div>
                </div>
                <div v-else class="mt-2 text-sm">
                  <div class="flex items-center">
                    <input
                      v-model="skipApiTest"
                      type="checkbox"
                      id="skip-api-test-success"
                      class="w-4 h-4 text-primary border-surface-300 rounded focus:ring-primary"
                    />
                    <label for="skip-api-test-success" class="ml-2 text-xs text-surface-600 dark:text-surface-400">
                      {{ t('installation_skip_api_test_continue_installation') }}
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <div class="flex justify-between mt-6">
              <button
                @click="currentStep = 1"
                class="px-6 py-3 border border-surface-300 dark:border-surface-600 text-surface-700 dark:text-surface-300 rounded-lg hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors"
              >
                {{ t('installation_previous_step') }}
              </button>
              <button
                @click="currentStep = 3"
                :disabled="!formData.tmdbApiKey || (!apiTestResult && !skipApiTest)"
                class="px-6 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {{ t('installation_next_step') }}
              </button>
            </div>
          </div>

          <div v-else-if="currentStep === 3">
            <h2 class="text-2xl font-bold text-surface-900 dark:text-surface-100 mb-6">{{ t('create_admin_account') }}</h2>
            
            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                  {{ t('installation_username') }} *
                </label>
                <input
                  v-model="formData.username"
                  type="text"
                  :placeholder="t('username_placeholder')"
                  class="w-full px-4 py-3 border border-surface-300 dark:border-surface-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-surface-50 dark:bg-surface-800 text-surface-900 dark:text-surface-100"
                />
              </div>

              <div>
                <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                  {{ t('installation_nickname') }}
                </label>
                <input
                  v-model="formData.nickname"
                  type="text"
                  :placeholder="t('nickname_placeholder')"
                  class="w-full px-4 py-3 border border-surface-300 dark:border-surface-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-surface-50 dark:bg-surface-800 text-surface-900 dark:text-surface-100"
                />
              </div>

              <div>
                <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                  {{ t('installation_password') }} *
                </label>
                <input
                  v-model="formData.password"
                  type="password"
                  :placeholder="t('password_placeholder')"
                  class="w-full px-4 py-3 border border-surface-300 dark:border-surface-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-surface-50 dark:bg-surface-800 text-surface-900 dark:text-surface-100"
                />
              </div>

              <div>
                <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                  {{ t('installation_confirm_password') }} *
                </label>
                <input
                  v-model="formData.confirmPassword"
                  type="password"
                  :placeholder="t('confirm_password_placeholder')"
                  class="w-full px-4 py-3 border border-surface-300 dark:border-surface-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-surface-50 dark:bg-surface-800 text-surface-900 dark:text-surface-100"
                />
              </div>

              <div v-if="passwordError" class="p-3 bg-red-50 text-red-700 rounded-lg">
                {{ passwordError }}
              </div>
            </div>

            <div class="flex justify-between mt-6">
              <button
                @click="currentStep = 2"
                class="px-6 py-3 border border-surface-300 dark:border-surface-600 text-surface-700 dark:text-surface-300 rounded-lg hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors"
              >
                {{ t('installation_previous_step') }}
              </button>
              <button
                @click="currentStep = 4"
                :disabled="!canProceedToInstall"
                class="px-6 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {{ t('installation_next_step') }}
              </button>
            </div>
          </div>

          <div v-else-if="currentStep === 4">
            <h2 class="text-2xl font-bold text-surface-900 dark:text-surface-100 mb-6">{{ t('install_confirmation') }}</h2>
            
            <div class="space-y-4 mb-6">
              <div class="p-4 bg-surface-50 dark:bg-surface-800 rounded-lg">
                <h3 class="font-semibold text-surface-900 dark:text-surface-100 mb-2">{{ t('installation_tmdb_api_config') }}</h3>
                <p class="text-sm text-surface-600 dark:text-surface-400">{{ t('installation_api_key') }}: {{ maskApiKey(formData.tmdbApiKey) }}</p>
                <p class="text-sm text-surface-600 dark:text-surface-400">{{ t('installation_base_url') }}: {{ formData.tmdbApiBaseUrl }}</p>
                <div v-if="formData.proxyEnabled" class="mt-2">
                  <p class="text-sm text-surface-600 dark:text-surface-400">{{ t('installation_http_proxy') }}: {{ formData.httpProxy }}</p>
                  <p class="text-sm text-surface-600 dark:text-surface-400">{{ t('installation_https_proxy') }}: {{ formData.httpsProxy }}</p>
                  <p class="text-sm text-surface-600 dark:text-surface-400">{{ t('installation_socks5_proxy') }}: {{ formData.allProxy }}</p>
                  <p v-if="formData.proxyUrl" class="text-sm text-surface-600 dark:text-surface-400">{{ t('installation_general_proxy') }}: {{ formData.proxyUrl }}</p>
                </div>
              </div>

              <div class="p-4 bg-surface-50 dark:bg-surface-800 rounded-lg">
                <h3 class="font-semibold text-surface-900 dark:text-surface-100 mb-2">{{ t('installation_admin_account') }}</h3>
                <p class="text-sm text-surface-600 dark:text-surface-400">{{ t('installation_username') }}: {{ formData.username }}</p>
                <p class="text-sm text-surface-600 dark:text-surface-400">{{ t('installation_nickname') }}: {{ formData.nickname || t('installation_not_set') }}</p>
              </div>
            </div>

            <div class="flex justify-between">
              <button
                @click="currentStep = 3"
                class="px-6 py-3 border border-surface-300 dark:border-surface-600 text-surface-700 dark:text-surface-300 rounded-lg hover:bg-surface-50 dark:hover:bg-surface-800 transition-colors"
              >
                {{ t('installation_previous_step') }}
              </button>
              <button
                @click="startInstallation"
                :disabled="installing"
                class="px-6 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <i v-if="installing" class="pi pi-spin pi-spinner mr-2"></i>
                {{ installing ? t('installation_installing') : t('installation_start_installation') }}
              </button>
            </div>
          </div>

          <div v-else-if="currentStep === 5">
            <div class="text-center">
              <i class="pi pi-check-circle text-6xl text-green-500 mb-4"></i>
              <h2 class="text-2xl font-bold text-surface-900 dark:text-surface-100 mb-4">{{ t('installation_installation_complete') }}</h2>
              <p class="text-surface-600 dark:text-surface-400 mb-6">
                {{ t('installation_success_desc') }}
              </p>
              <button
                @click="goToHome"
                class="px-6 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
              >
                {{ t('installation_enter_system') }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </SimpleLayout>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'
import SimpleLayout from '../components/SimpleLayout.vue'
import { useToast } from 'primevue/usetoast';
import { t } from '../composables/useI18n';

const router = useRouter()
const toast = useToast();

// 页面状态
const currentStep = ref(1)
const installing = ref(false)
const apiTestResult = ref<boolean | null>(null)

// 表单数据
const formData = ref({
  tmdbApiKey: '',
  tmdbApiBaseUrl: 'https://api.tmdb.org',
  tmdbImageBaseUrl: 'https://image.tmdb.org',
  proxyEnabled: false,
  proxyUrl: '',
  httpProxy: 'http://127.0.0.1:7890',
  httpsProxy: 'http://127.0.0.1:7890',
  allProxy: 'socks5://127.0.0.1:7890',
  username: '',
  nickname: '',
  password: '',
  confirmPassword: ''
})

// 跳过API测试
const skipApiTest = ref(false)

// 密码错误信息
const passwordError = computed(() => {
  if (formData.value.password && formData.value.confirmPassword && formData.value.password !== formData.value.confirmPassword) {
    return t('password_mismatch')
  }
  if (formData.value.password && formData.value.password.length < 6) {
    return t('password_too_short')
  }
  return ''
})

// 是否可以进入下一步
const canProceedToInstall = computed(() => {
  return formData.value.username && 
         formData.value.password && 
         formData.value.confirmPassword && 
         formData.value.password === formData.value.confirmPassword &&
         formData.value.password.length >= 6
})

// 测试TMDB API连接
const testTMDBConnection = async () => {
  if (!formData.value.tmdbApiKey) {
    apiTestResult.value = null
    return
  }

  try {
    const response = await $fetch<{
      success: boolean
      message: string
    }>('/api/install/test-tmdb', {
      method: 'POST',
      body: {
        apiKey: formData.value.tmdbApiKey,
        baseUrl: formData.value.tmdbApiBaseUrl,
        proxyUrl: formData.value.proxyEnabled ? formData.value.proxyUrl : undefined,
        httpProxy: formData.value.proxyEnabled ? formData.value.httpProxy : undefined,
        httpsProxy: formData.value.proxyEnabled ? formData.value.httpsProxy : undefined,
        allProxy: formData.value.proxyEnabled ? formData.value.allProxy : undefined
      }
    })
    apiTestResult.value = response.success
  } catch (error) {
    apiTestResult.value = false
  }
}

// 掩码API Key
const maskApiKey = (apiKey: string) => {
  if (!apiKey) return ''
  return apiKey.substring(0, 8) + '...' + apiKey.substring(apiKey.length - 4)
}

// 开始安装
const startInstallation = async () => {
  installing.value = true
  
  try {
    const response = await $fetch<{
      success: boolean
      message: string
    }>('/api/install/complete', {
      method: 'POST',
      body: {
        tmdbApiKey: formData.value.tmdbApiKey,
        tmdbApiBaseUrl: formData.value.tmdbApiBaseUrl,
        tmdbImageBaseUrl: formData.value.tmdbImageBaseUrl,
        proxyEnabled: formData.value.proxyEnabled,
        proxyUrl: formData.value.proxyUrl,
        httpProxy: formData.value.proxyEnabled ? formData.value.httpProxy : undefined,
        httpsProxy: formData.value.proxyEnabled ? formData.value.httpsProxy : undefined,
        allProxy: formData.value.proxyEnabled ? formData.value.allProxy : undefined,
        username: formData.value.username,
        nickname: formData.value.nickname,
        password: formData.value.password
      }
    })
    
    if (response.success) {
      currentStep.value = 5
    } else {
      toast.add({ severity: 'error', summary: t('installation_failed'), detail: t(response.message), life: 5000 })
    }
  } catch (error) {
    toast.add({ severity: 'error', summary: t('installation_failed'), detail: t('installation_failed'), life: 5000 })
  } finally {
    installing.value = false
  }
}

// 跳转到首页
const goToHome = () => {
  router.push('/')
}


// 设置页面标题
useHead({
  title: t('installation') + ' - MoviCloud',
  meta: [ { name: 'description', content: t('welcome_install_desc') } ]
})
</script> 