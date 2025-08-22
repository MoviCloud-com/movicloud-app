<script setup lang="ts">
import SelectButton from '../volt/SelectButton.vue';
import InputText from '../volt/InputText.vue';
import Select from '../volt/Select.vue';
import { useLayout } from '../composables/use-layout';
import { t, getSupportedLanguages, setLanguage, initLanguage } from '../composables/useI18n';
import { useToast } from 'primevue/usetoast';
import { useConfirm } from 'primevue/useconfirm';
import type { ThemeMode } from '../types/layout';
import { useDev } from '../composables/useDev';
import { useSettingsCache } from '../composables/useSettingsCache';

const { themeMode, setThemeMode, primaryColors, surfaces, updateColors, isDarkMode, bodyFont, headingFont, updateFonts } = useLayout();
const toast = useToast();
const confirm = useConfirm();
const { log, error: devError } = useDev();
const { clearCache: clearSettingsCache } = useSettingsCache();

// 支持的语言列表
const supportedLanguages = getSupportedLanguages()

// 选项卡配置 - 使用computed属性以支持多语言
const tabs = computed(() => {
  // 确保t函数可用
  if (typeof t !== 'function') return []
  
  return [
    { id: 'theme', name: t('theme_settings'), icon: 'pi pi-palette' },
    { id: 'tmdb', name: 'TMDB API', icon: 'pi pi-database' },
    { id: 'proxy', name: t('proxy_settings'), icon: 'pi pi-globe' },
    { id: 'language', name: t('language_settings'), icon: 'pi pi-globe' },
    { id: 'system', name: t('system_settings'), icon: 'pi pi-cog' }
  ]
})

const activeTab = ref('theme')

// 修复：确保选项值与 ThemeMode 类型一致 - 改为computed属性以支持多语言
const themeOptions = computed(() => {
  // 确保t函数可用
  if (typeof t !== 'function') return []
  
  return [
    { label: t('theme_light'), value: 'light' as ThemeMode },
    { label: t('theme_dark'), value: 'dark' as ThemeMode },
    { label: t('theme_system'), value: 'system' as ThemeMode }
  ]
});

// 字体选项
const systemFontStack = "system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, 'PingFang SC', 'Noto Sans CJK SC', 'Microsoft YaHei', sans-serif"
const availableFontFamilies = ['AlimamaDaoLiTi', 'DingTalk-JinBuTi', 'Yozai-Regular', 'Nabla-Regular', 'AlimamaShuHeiTi-Bold', 'AlimamaDongFangDaKai-Regular', 'AlimamaAgileVF-Thin', 'AlimamaFangYuanTiVF-Thin', 'TsangerYuYangT', 'SmileySans-Oblique', 'Alibaba-PuHuiTi', 'Source Han Sans SC', 'Source Han Serif SC Light']
const fontOptions = computed(() => {
  if (typeof t !== 'function') return []
  return [
    { label: t('system_default'), value: systemFontStack },
    ...availableFontFamilies.map(name => ({ label: name, value: `'${name}', ${systemFontStack}` }))
  ]
})

// 代理启用选项 - 使用computed属性以支持多语言
const proxyOptions = computed(() => {
  // 确保t函数可用
  if (typeof t !== 'function') return []
  
  return [
    { label: t('enabled'), value: true },
    { label: t('disabled'), value: false }
  ]
});

// 主题模式的计算属性
const themeModeValue = computed({
  get: () => themeMode.value,
  set: (value: ThemeMode) => {
    log('Setting theme mode to:', value)
    setThemeMode(value)
  }
})

// 代理启用的计算属性
const proxyEnabledValue = computed({
  get: () => settings.value.proxyEnabled,
  set: (value: boolean) => {
    log('Setting proxy enabled to:', value)
    settings.value.proxyEnabled = value
  }
})

const handleColorChange = (colorName: string): void => {
  const color = primaryColors.value.find(c => c.name === colorName);
  if (color) {
    updateColors('primary', color);
  }
};

const handleSurfaceChange = (colorName: string): void => {
  const color = surfaces.value.find(c => c.name === colorName);
  if (color) {
    updateColors('surface', color);
  }
};

// 设置相关
const settings = ref({
  tmdbApiKey: '',
  tmdbApiBaseUrl: 'https://api.tmdb.org',
  tmdbImageBaseUrl: 'https://image.tmdb.org',
  proxyEnabled: false,
  httpProxy: 'http://127.0.0.1:7890',
  httpsProxy: 'http://127.0.0.1:7890',
  allProxy: 'socks5://127.0.0.1:7890',
  language: 'zh-CN'
})

const loading = ref(false)
const saving = ref(false)
const testResult = ref<{ success: boolean; message: string } | null>(null)
const resetLoading = ref(false)

// 加载设置
const loadSettings = async () => {
  try {
    loading.value = true
    const [tmdbResponse, proxyResponse, languageResponse] = await Promise.all([
      $fetch<{ success: boolean; data?: any }>('/api/settings/tmdb'),
      $fetch<{ success: boolean; data?: any }>('/api/settings/proxy'),
      $fetch<{ success: boolean; data?: any }>('/api/settings/language')
    ])
    
    if (tmdbResponse.success && tmdbResponse.data) {
      settings.value.tmdbApiKey = tmdbResponse.data.apiKey || ''
      settings.value.tmdbApiBaseUrl = tmdbResponse.data.apiBaseUrl || 'https://api.tmdb.org'
      settings.value.tmdbImageBaseUrl = tmdbResponse.data.imageBaseUrl || 'https://image.tmdb.org'
    }
    
    if (proxyResponse.success && proxyResponse.data) {
      settings.value.proxyEnabled = proxyResponse.data.proxyEnabled || false
      settings.value.httpProxy = proxyResponse.data.httpProxy || 'http://127.0.0.1:7890'
      settings.value.httpsProxy = proxyResponse.data.httpsProxy || 'http://127.0.0.1:7890'
      settings.value.allProxy = proxyResponse.data.allProxy || 'socks5://127.0.0.1:7890'
    }
    
    if (languageResponse.success && languageResponse.data) {
      settings.value.language = languageResponse.data.language || 'zh-CN'
      setLanguage(settings.value.language)
    }
  } catch (error) {
    devError('加载设置失败:', error)
  } finally {
    loading.value = false
  }
}

// 保存TMDB设置
const saveTMDBSettings = async () => {
  try {
    saving.value = true
    
    await $fetch('/api/settings/tmdb', {
      method: 'POST',
      body: {
        apiKey: settings.value.tmdbApiKey,
        apiBaseUrl: settings.value.tmdbApiBaseUrl,
        imageBaseUrl: settings.value.tmdbImageBaseUrl
      }
    })
    
    // 清除设置缓存，确保下次获取最新设置
    clearSettingsCache()
    
    toast.add({
      severity: 'success',
      summary: t('success'),
      detail: t('save_tmdb_success'),
      life: 3000
    })
  } catch (error) {
    devError('保存TMDB设置失败:', error)
    toast.add({
      severity: 'error',
      summary: t('error'),
      detail: t('save_tmdb_failed'),
      life: 3000
    })
  } finally {
    saving.value = false
  }
}

// 保存代理设置
const saveProxySettings = async () => {
  try {
    saving.value = true
    
    await $fetch('/api/settings/proxy', {
      method: 'POST',
      body: {
        proxyEnabled: settings.value.proxyEnabled,
        httpProxy: settings.value.httpProxy,
        httpsProxy: settings.value.httpsProxy,
        allProxy: settings.value.allProxy
      }
    })
    
    // 清除设置缓存，确保下次获取最新设置
    clearSettingsCache()
    
    toast.add({
      severity: 'success',
      summary: t('success'),
      detail: t('save_proxy_success'),
      life: 3000
    })
  } catch (error) {
    devError('保存代理设置失败:', error)
    toast.add({
      severity: 'error',
      summary: t('error'),
      detail: t('save_proxy_failed'),
      life: 3000
    })
  } finally {
    saving.value = false
  }
}

// 保存语言设置
const saveLanguageSettings = async () => {
  try {
    saving.value = true
    
    const response = await $fetch<{success: boolean, message: string}>('/api/settings/language', {
      method: 'POST',
      body: {
        language: settings.value.language
      }
    })
    
    if (response.success) {
      // 设置当前语言
      setLanguage(settings.value.language)
      
      // 清除设置缓存，确保下次获取最新设置
      clearSettingsCache()
      
      toast.add({
        severity: 'success',
        summary: t('success'),
        detail: t(response.message),
        life: 3000
      })
    } else {
      toast.add({
        severity: 'error',
        summary: t('error'),
        detail: t(response.message),
        life: 3000
      })
    }
  } catch (error) {
    devError('保存语言设置失败:', error)
    toast.add({
      severity: 'error',
      summary: t('error'),
      detail: t('save_language_failed'),
      life: 3000
    })
  } finally {
    saving.value = false
  }
}

// 测试TMDB API
const testTMDB = async () => {
  try {
    testResult.value = null
    
    const response = await $fetch<{success: boolean, message: string}>('/api/settings/test-tmdb', {
      method: 'POST',
      body: {
        apiKey: settings.value.tmdbApiKey,
        apiBaseUrl: settings.value.tmdbApiBaseUrl
      }
    })
    
    testResult.value = {
      success: response.success,
      message: t(response.message)
    }
  } catch (error) {
    devError('测试TMDB API失败:', error)
    testResult.value = {
      success: false,
      message: t('installation_network_failed')
    }
  }
}

// 测试代理
const testProxy = async () => {
  try {
    testResult.value = null
    
    const response = await $fetch<{success: boolean, message: string}>('/api/settings/test-proxy', {
      method: 'POST',
      body: {
        proxyEnabled: settings.value.proxyEnabled,
        httpProxy: settings.value.httpProxy,
        httpsProxy: settings.value.httpsProxy,
        allProxy: settings.value.allProxy
      }
    })
    
    testResult.value = {
      success: response.success,
      message: t(response.message)
    }
  } catch (error) {
    devError('测试代理失败:', error)
    testResult.value = {
      success: false,
      message: t('installation_network_failed')
    }
  }
}

// 恢复出厂设置
const handleReset = async () => {
  try {
    resetLoading.value = true
    
    await $fetch('/api/settings/reset', {
      method: 'POST'
    })
    
    toast.add({
      severity: 'success',
      summary: t('success'),
      detail: t('factory_reset_success'),
      life: 3000
    })
    
    // 延迟跳转到安装页面
    setTimeout(() => {
      window.location.href = '/install'
    }, 3000)
  } catch (error) {
    devError('恢复出厂设置失败:', error)
    toast.add({
      severity: 'error',
      summary: t('error'),
      detail: t('factory_reset_failed'),
      life: 3000
    })
  } finally {
    resetLoading.value = false
  }
}

const showResetConfirm = () => {
    confirm.require({
        message: t('confirm_reset_message'),
        header: t('confirm_reset_title'),
        rejectProps: {
            label: t('cancel'),
            severity: 'secondary',
            outlined: true
        },
        acceptProps: {
            label: t('confirm')
        },
        accept: () => {
            toast.add({ severity: 'info', summary: t('confirm_operation'), detail: t('confirm'), life: 3000 });
        },
        reject: () => {
            toast.add({ severity: 'error', summary: t('cancel'), detail: t('cancel'), life: 3000 });
        }
    });
};

// 页面加载时获取数据
onMounted(async () => {
  // 初始化语言设置
  await initLanguage()
  // 加载其他设置
  loadSettings()
})

// 设置页面标题
useHead({
  title: t('settings') + ' - MoviCloud',
  meta: [
    { name: 'description', content: t('settings') + ' - ' + t('welcome_to_movicloud') }
  ]
})
</script>

<template>
  <div class="bg-surface-50 dark:bg-surface-950 min-h-screen">
    <!-- 背景头部 -->
    <div class="relative h-48 bg-gradient-to-b from-primary-500 to-transparent">
      <!-- 背景装饰 -->
      <div class="absolute inset-0"></div>
      
      <!-- 内容 -->
      <div class="relative h-full flex items-center justify-center">
        <div class="text-center text-white">
          <h1 class="text-5xl font-bold mb-4">{{ t('system_settings') }}</h1>
          <p class="text-xl opacity-90">{{ t('system_settings_subtitle') }}</p>
        </div>
      </div>
      
      <!-- 底部渐变 -->
      <div class="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-b from-transparent to-surface-50 dark:to-surface-950"></div>
    </div>
    
    <div class="p-6">
      <div class="mx-auto">
        <!-- 选项卡导航 -->
        <div class="mb-6">
          <div class="border-b border-surface-200 dark:border-surface-700">
            <nav class="flex space-x-8">
              <button
                v-for="tab in tabs"
                :key="tab.id"
                @click="activeTab = tab.id"
                class="py-2 px-1 border-b-2 font-medium text-sm transition-colors"
                :class="activeTab === tab.id 
                  ? 'border-primary-500 text-primary-600 dark:text-primary-400' 
                  : 'border-transparent text-surface-500 hover:text-surface-700 hover:border-surface-300 dark:text-surface-400 dark:hover:text-surface-300'"
              >
                <i :class="tab.icon" class="mr-2"></i>
                {{ tab.name }}
              </button>
            </nav>
          </div>
        </div>

        <!-- 主题设置选项卡 -->
        <div v-if="activeTab === 'theme'" class="bg-surface-200 dark:bg-surface-800 rounded-lg shadow-sm p-6">
          <h3 class="text-xl font-semibold text-surface-900 dark:text-surface-0 mb-6">{{ t('theme_settings') }}</h3>
          
          <!-- 主题模式 -->
          <div class="mb-8">
            <h4 class="font-medium text-surface-900 dark:text-surface-0 mb-4">{{ t('theme_mode') }}</h4>
            <div class="flex items-center">
              <SelectButton
                v-model="themeModeValue"
                :options="themeOptions"
                optionLabel="label"
                optionValue="value"
                :multiple="false"
                :allowEmpty="false"
                :unselectable="false"
                class="w-full max-w-md"
              />
            </div>
          </div>

          <!-- 字体设置 -->
          <div class="mb-8">
            <h4 class="font-medium text-surface-900 dark:text-surface-0 mb-4">{{ t('font_settings') }}</h4>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl">
              <div>
                <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">{{ t('heading_font') }}</label>
                <Select
                  :modelValue="headingFont"
                  :options="fontOptions"
                  optionLabel="label"
                  optionValue="value"
                  :placeholder="t('select_font')"
                  class="w-full"
                  @update:modelValue="(val: string) => updateFonts({ headingFont: val })"
                />
              </div>
              <div>
                <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">{{ t('body_font') }}</label>
                <Select
                  :modelValue="bodyFont"
                  :options="fontOptions"
                  optionLabel="label"
                  optionValue="value"
                  :placeholder="t('select_font')"
                  class="w-full"
                  @update:modelValue="(val: string) => updateFonts({ bodyFont: val })"
                />
              </div>
            </div>
          </div>

          <!-- 主题色选择 -->
          <div class="mb-8">
            <h4 class="font-medium text-surface-900 dark:text-surface-0 mb-4">{{ t('theme_color') }}</h4>
            <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-8 gap-4">
              <div 
                v-for="color in primaryColors" 
                :key="color.name"
                @click="handleColorChange(color.name)"
                class="relative group cursor-pointer"
                :title="t('select_theme_color', { name: color.name })"
              >
                <!-- 颜色预览卡片 -->
                <div class="bg-surface-100 dark:bg-surface-900 rounded-lg border-2 transition-all duration-200 hover:shadow-lg hover:scale-105"
                     :class="color.name === useLayout().primary.value ? 'border-primary-500 shadow-lg' : 'border-surface-200 dark:border-surface-600'">
                  
                  <!-- 顶部颜色条 -->
                  <div class="h-3 rounded-t" :style="{ backgroundColor: color.palette[500] }"></div>
                  
                  <!-- 模拟UI布局 -->
                  <div class="p-3">
                    <!-- 模拟按钮和图标 -->
                    <div class="flex space-x-2">
                      <div class="flex-1 h-6 rounded" :style="{ backgroundColor: color.palette[500] }"></div>
                      <div class="w-6 h-6 rounded" :style="{ backgroundColor: color.palette[400] }"></div>
                    </div>
                    
                    <!-- 模拟进度条 -->
                    <div class="mt-2">
                      <div class="w-full h-1 rounded-full bg-gray-200">
                        <div class="h-1 rounded-full" :style="{ backgroundColor: color.palette[500], width: '60%' }"></div>
                      </div>
                    </div>
                  </div>
                  
                  <!-- 颜色名称 -->
                  <div class="px-3 pb-2">
                    <p class="text-xs font-medium text-surface-700 dark:text-surface-300 text-center">
                      {{ t(color.name) }}
                    </p>
                    <!-- 颜色值预览 -->
                    <div class="flex justify-center space-x-1 mt-1">
                      <div v-for="shade in [300, 400, 500, 600]" :key="shade" 
                           class="w-3 h-3 rounded-full border border-white dark:border-surface-600"
                           :style="{ backgroundColor: color.palette[shade] }"
                           :title="`${color.name} ${shade}`">
                      </div>
                    </div>
                  </div>
                </div>
                
                <!-- 选中指示器 -->
                <div v-if="color.name === useLayout().primary.value" 
                     class="absolute -top-1 -right-1 w-5 h-5 bg-primary-500 rounded-full flex items-center justify-center">
                  <i class="pi pi-check text-white text-xs"></i>
                </div>
              </div>
            </div>
          </div>
          
          <!-- 表面色选择 -->
          <div>
            <h4 class="font-medium text-surface-900 dark:text-surface-0 mb-4">{{ t('surface_color') }}</h4>
            <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-8 gap-4">
              <div 
                v-for="surface in surfaces" 
                :key="surface.name"
                @click="handleSurfaceChange(surface.name)"
                class="relative group cursor-pointer"
                :title="t('select_surface_color', { name: surface.name })"
              >
                <!-- 表面色预览卡片 -->
                <div class="rounded-lg border-2 transition-all duration-200 hover:shadow-lg hover:scale-105"
                     :class="surface.name === useLayout().surface.value ? 'border-primary-500 shadow-lg' : 'border-surface-200 dark:border-surface-600'"
                     :style="{ backgroundColor: surface.palette[900] }">
                  
                  <!-- 模拟UI布局 -->
                  <div class="p-3">
                    <!-- 模拟卡片背景 -->
                    <div class="rounded p-2 mb-2" :style="{ backgroundColor: surface.palette[700] }">
                      <div class="flex items-center justify-between">
                        <div class="flex items-center space-x-2">
                          <div class="w-4 h-4 rounded-full" :style="{ backgroundColor: surface.palette[300] }"></div>
                          <div class="w-12 h-1 rounded" :style="{ backgroundColor: surface.palette[200] }"></div>
                        </div>
                        <div class="w-3 h-3 rounded" :style="{ backgroundColor: surface.palette[300] }"></div>
                      </div>
                    </div>
                    
                    <!-- 模拟内容区域 -->
                    <div class="space-y-1">
                      <div class="w-full h-2 rounded" :style="{ backgroundColor: surface.palette[200] }"></div>
                      <div class="w-4/5 h-1 rounded" :style="{ backgroundColor: surface.palette[200] }"></div>
                      <div class="w-3/4 h-1 rounded" :style="{ backgroundColor: surface.palette[200] }"></div>
                    </div>
                  </div>
                  
                  <!-- 表面色名称 -->
                  <div class="px-3 pb-2">
                    <p class="text-xs font-medium text-surface-700 dark:text-surface-300 text-center">
                      {{ t(surface.name) }}
                    </p>
                    <!-- 表面色值预览 -->
                    <div class="flex justify-center space-x-1 mt-1">
                      <div v-for="shade in [50, 100, 200, 300]" :key="shade" 
                           class="w-3 h-3 rounded-full border border-white dark:border-surface-600"
                           :style="{ backgroundColor: surface.palette[shade] }"
                           :title="`${surface.name} ${shade}`">
                      </div>
                    </div>
                  </div>
                </div>
                
                <!-- 选中指示器 -->
                <div v-if="surface.name === useLayout().surface.value" 
                     class="absolute -top-1 -right-1 w-5 h-5 bg-primary-500 rounded-full flex items-center justify-center">
                  <i class="pi pi-check text-white text-xs"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- TMDB API设置选项卡 -->
        <div v-if="activeTab === 'tmdb'" class="bg-surface-200  dark:bg-surface-800 rounded-lg shadow-sm p-6">
          <h3 class="text-xl font-semibold text-surface-900 dark:text-surface-0 mb-6">{{ t('tmdb_api_settings') }}</h3>
          
          <div v-if="loading" class="text-center py-8">
            <i class="pi pi-spin pi-spinner text-2xl text-primary-500"></i>
            <p class="mt-2 text-surface-600 dark:text-surface-400">{{ t('loading_settings') }}</p>
          </div>
          
          <div v-else class="space-y-6">
            <div>
              <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                {{ t('tmdb_api_key') }}
              </label>
              <InputText
                v-model="settings.tmdbApiKey"
                type="password"
                :placeholder="t('tmdb_api_key_placeholder')"
                class="w-full"
              />
            </div>
            
            <div>
              <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                {{ t('tmdb_api_base_url') }}
              </label>
              <InputText
                v-model="settings.tmdbApiBaseUrl"
                type="text"
                placeholder="https://api.tmdb.org"
                class="w-full"
              />
              <p class="text-xs text-surface-500 mt-1">{{ t('tmdb_api_base_url_hint') }}</p>
            </div>
            
            <div>
              <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                {{ t('tmdb_image_base_url') }}
              </label>
              <InputText
                v-model="settings.tmdbImageBaseUrl"
                type="text"
                placeholder="https://image.tmdb.org"
                class="w-full"
              />
              <p class="text-xs text-surface-500 mt-1">{{ t('tmdb_image_base_url_hint') }}</p>
            </div>
            
            <div class="flex gap-3">
              <button
                @click="testTMDB"
                :disabled="!settings.tmdbApiKey"
                class="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {{ t('test_api_connection') }}
              </button>
              
              <button
                @click="saveTMDBSettings"
                :disabled="saving"
                class="px-6 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <i v-if="saving" class="pi pi-spin pi-spinner mr-2"></i>
                {{ saving ? t('saving') : t('save_settings') }}
              </button>
            </div>
            
            <!-- 测试结果 -->
            <div v-if="testResult" class="p-4 rounded-lg" :class="testResult.success ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400' : 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400'">
              <div class="flex items-center">
                <i :class="testResult.success ? 'pi pi-check-circle' : 'pi pi-exclamation-triangle'" class="mr-2"></i>
                <span>{{ testResult.message }}</span>
              </div>
            </div>
          </div>
        </div>
        
        <!-- 代理设置选项卡 -->
        <div v-if="activeTab === 'proxy'" class="bg-surface-200  dark:bg-surface-800 rounded-lg shadow-sm p-6">
          <h3 class="text-xl font-semibold text-surface-900 dark:text-surface-0 mb-6">{{ t('proxy_settings') }}</h3>
          
          <div class="space-y-6">
            <div>
              <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                {{ t('proxy_enabled') }}
              </label>
              <SelectButton
                v-model="proxyEnabledValue"
                :options="proxyOptions"
                optionLabel="label"
                optionValue="value"
                :multiple="false"
                :allowEmpty="false"
                @change="(event: any) => { log('Proxy enabled changed:', event.value); }"
                class="w-full max-w-md"
              />
            </div>
            
            <div v-if="settings.proxyEnabled" class="space-y-6">
              <div>
                <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                  {{ t('http_proxy') }}
                </label>
                <InputText
                  v-model="settings.httpProxy"
                  type="text"
                  :placeholder="t('http_proxy_placeholder')"
                  class="w-full"
                />
              </div>
              
              <div>
                <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                  {{ t('https_proxy') }}
                </label>
                <InputText
                  v-model="settings.httpsProxy"
                  type="text"
                  :placeholder="t('https_proxy_placeholder')"
                  class="w-full"
                />
              </div>
              
              <div>
                <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                  {{ t('socks5_proxy') }}
                </label>
                <InputText
                  v-model="settings.allProxy"
                  type="text"
                  :placeholder="t('socks5_proxy_placeholder')"
                  class="w-full"
                />
              </div>
            </div>
            
            <div class="flex gap-3">
              <button
                @click="saveProxySettings"
                :disabled="saving"
                class="px-6 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <i v-if="saving" class="pi pi-spin pi-spinner mr-2"></i>
                {{ saving ? t('saving') : t('save') }}
              </button>
              
              <button
                @click="testProxy"
                :disabled="!settings.proxyEnabled"
                class="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {{ t('test_proxy') }}
              </button>
            </div>
            
            <!-- 测试结果 -->
            <div v-if="testResult" class="p-4 rounded-lg" :class="testResult.success ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400' : 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400'">
              <div class="flex items-center">
                <i :class="testResult.success ? 'pi pi-check-circle' : 'pi pi-exclamation-triangle'" class="mr-2"></i>
                <span>{{ testResult.message }}</span>
              </div>
            </div>
          </div>
        </div>
        
        <!-- 语言设置选项卡 -->
        <div v-if="activeTab === 'language'" class="bg-surface-200  dark:bg-surface-800 rounded-lg shadow-sm p-6">
          <h3 class="text-xl font-semibold text-surface-900 dark:text-surface-0 mb-6">{{ t('language_settings') }}</h3>
          
          <div class="space-y-6">
            <div>
              <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                {{ t('language') }}
              </label>
              <Select
                v-model="settings.language"
                :options="supportedLanguages"
                optionLabel="name"
                optionValue="code"
                :placeholder="t('select_language')"
                class="w-full"
              />
              <p class="text-xs text-surface-500 mt-1">{{ t('language_description') }}</p>
            </div>
            
            <div class="flex gap-3">
              <button
                @click="saveLanguageSettings"
                :disabled="saving"
                class="px-6 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <i v-if="saving" class="pi pi-spin pi-spinner mr-2"></i>
                {{ saving ? t('saving') : t('save') }}
              </button>
            </div>
          </div>
        </div>
        
        <!-- 账户设置选项卡 -->
        <div v-if="activeTab === 'account'" class="bg-surface-200  dark:bg-surface-800 rounded-lg shadow-sm p-6">
          <h3 class="text-xl font-semibold text-surface-900 dark:text-surface-0 mb-6">{{ t('account_settings') }}</h3>
          
          <div class="space-y-4">
            <button class="w-full text-left px-4 py-3 bg-surface-50 dark:bg-surface-700 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-600 transition-colors">
              <div class="flex items-center justify-between">
                <span class="text-surface-900 dark:text-surface-0">{{ t('change_password') }}</span>
                <i class="pi pi-angle-right text-surface-500 dark:text-surface-400"></i>
              </div>
            </button>
            
            <button class="w-full text-left px-4 py-3 bg-surface-50 dark:bg-surface-700 rounded-lg hover:bg-surface-100 dark:hover:bg-surface-600 transition-colors">
              <div class="flex items-center justify-between">
                <span class="text-surface-900 dark:text-surface-0">{{ t('privacy_settings') }}</span>
                <i class="pi pi-angle-right text-surface-500 dark:text-surface-400"></i>
              </div>
            </button>
            
            <button class="w-full text-left px-4 py-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors">
              <span>{{ t('delete_account') }}</span>
            </button>
          </div>
        </div>
        
        <!-- 系统设置选项卡 -->
        <div v-if="activeTab === 'system'" class="bg-surface-200  dark:bg-surface-800 rounded-lg shadow-sm p-6">
          <h3 class="text-xl font-semibold text-surface-900 dark:text-surface-0 mb-6">{{ t('system_settings') }}</h3>
          
          <div class="space-y-4">
            <button 
              @click="showResetConfirm"
              :disabled="resetLoading"
              class="w-full text-left px-4 py-3 bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 rounded-lg hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-3">
                  <i v-if="resetLoading" class="pi pi-spin pi-spinner text-lg"></i>
                  <i v-else class="pi pi-refresh text-lg"></i>
                  <span>{{ resetLoading ? t('resetting') : t('factory_reset') }}</span>
                </div>
                <i class="pi pi-exclamation-triangle text-lg"></i>
              </div>
            </button>
          </div>
        </div>
      </div>
    </div>
    

  </div>
</template>