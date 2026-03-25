<script setup lang="ts">
import SelectButton from '../volt/SelectButton.vue';
import InputText from '../volt/InputText.vue';
import Select from '../volt/Select.vue';
import Dialog from '../volt/Dialog.vue';
import Button from '../volt/Button.vue';
import { useLayout } from '../composables/use-layout';
import { t, getSupportedLanguages, setLanguage, initLanguage } from '../composables/useI18n';
import { useToast } from 'primevue/usetoast';
import type { ThemeMode } from '../types/layout';
import { useDev } from '../composables/useDev';
import { useSettingsCache } from '../composables/useSettingsCache';
import { useRouter } from 'vue-router';
import { useCloudDrives } from '../composables/useCloudDrives';
import { useDemoMode } from '../composables/useDemoMode';

const { themeMode, setThemeMode, primaryColors, surfaces, updateColors, bodyFont, headingFont, updateFonts } = useLayout();
const { cloudDrives, getDriveByCode } = useCloudDrives();
const toast = useToast();
const { log, error: devError } = useDev();
const { clearCache: clearSettingsCache } = useSettingsCache();
const router = useRouter();
const { isDemoMode, checkDemoPermission } = useDemoMode();

// 支持的语言列表
const supportedLanguages = getSupportedLanguages()

// 选项卡配置 - 使用computed属性以支持多语言
const tabs = computed(() => {
  // 确保t函数可用
  if (typeof t !== 'function') return []
  
  return [
    { id: 'theme', name: t('theme_settings'), icon: 'pi pi-palette' },
    { id: 'tmdb', name: 'TMDB API', icon: 'pi pi-database' },
    { id: 'trimedia', name: t('trimedia_settings'), icon: 'pi pi-play-circle' },
    { id: 'cloud-drive', name: t('cloud_drive_settings'), icon: 'pi pi-cloud' },
    { id: 'language', name: t('language_settings'), icon: 'pi pi-globe' },
    { id: 'system', name: t('system_settings'), icon: 'pi pi-cog' },
    { id: 'about', name: t('about_movicloud'), icon: 'pi pi-info-circle' }
  ]
})

const activeTab = ref('theme')

// 修复：确保选项值与 ThemeMode 类型一致 - 改为computed属性以支持多语言
const themeOptions = computed(() => {
  // 确保t函数可用
  if (typeof t !== 'function') return []
  
  return [
    { label: t('theme_light'), value: 'light' as ThemeMode, icon: 'pi pi-sun' },
    { label: t('theme_dark'), value: 'dark' as ThemeMode, icon: 'pi pi-moon' },
    { label: t('theme_system'), value: 'system' as ThemeMode, icon: 'pi pi-desktop' }
  ]
});

// 飞牛影视启用选项
const trimediaEnabledOptions = computed(() => {
  // 确保t函数可用
  if (typeof t !== 'function') return []
  
  return [
    { label: t('enabled'), value: true, icon: 'pi pi-check' },
    { label: t('disabled'), value: false, icon: 'pi pi-times' }
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

// 主题模式的计算属性
const themeModeValue = computed({
  get: () => themeMode.value,
  set: (value: ThemeMode) => {
    log('Setting theme mode to:', value)
    setThemeMode(value)
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
interface CloudDriveAccount {
  id: string
  name: string
  cookie?: string
  refreshToken?: string
  captchaUserId?: string
}

interface CloudDriveSettings {
  quark: CloudDriveAccount[]
  uc: CloudDriveAccount[]
  cloud123: CloudDriveAccount[]
  cloud115: CloudDriveAccount[]
  xunlei: CloudDriveAccount[]
}

const settings = ref({
  tmdbApiKey: '',
  tmdbApiBaseUrl: 'https://api.tmdb.org',
  tmdbImageBaseUrl: 'https://image.tmdb.org',
  language: 'zh-CN',
  trimediaHost: '',
  trimediaUsername: '',
  trimediaPassword: '',
  trimediaEnabled: false
})

const cloudDriveSettings = ref<CloudDriveSettings>({
  quark: [],
  uc: [],
  cloud123: [],
  cloud115: [],
  xunlei: []
})

const activeCloudDriveTab = ref('quark')

// 网盘选项
const cloudDriveOptions = computed(() => [
  { label: t('quark_cloud_drive'), value: 'quark' },
  { label: t('uc_cloud_drive'), value: 'uc' },
  { label: t('xunlei_cloud_drive'), value: 'xunlei' }
])

const loading = ref(false)
const saving = ref(false)
const testResult = ref<{ success: boolean; message: string } | null>(null)
const trimediaTestResult = ref<{ success: boolean; message: string } | null>(null)
const backupLoading = ref(false)
const restoreLoading = ref(false)
const restoreFileInput = ref<HTMLInputElement | null>(null)

// 网盘账号弹窗状态
const accountDialogVisible = ref(false)
const accountDialogMode = ref<'add' | 'edit'>('add')
const currentEditingAccount = ref<{
  type: keyof CloudDriveSettings | null
  index: number | null
  account: CloudDriveAccount
}>({
  type: null,
  index: null,
  account: { id: '', name: '', cookie: '' }
})

// 加载设置
const loadSettings = async () => {
  try {
    loading.value = true
    const [tmdbResponse, languageResponse, cloudDriveResponse, trimediaResponse] = await Promise.all([
      $fetch('/api/settings/tmdb'),
      $fetch('/api/settings/language'),
      $fetch('/api/settings/cloud-drive'),
      $fetch('/api/settings/trimedia')
    ])
    
    if (tmdbResponse.success && 'data' in tmdbResponse && tmdbResponse.data) {
      settings.value.tmdbApiKey = tmdbResponse.data.apiKey || ''
      settings.value.tmdbApiBaseUrl = tmdbResponse.data.apiBaseUrl || 'https://api.tmdb.org'
      settings.value.tmdbImageBaseUrl = tmdbResponse.data.imageBaseUrl || 'https://image.tmdb.org'
    }
    
    if (languageResponse.success && 'data' in languageResponse && languageResponse.data) {
      settings.value.language = languageResponse.data.language || 'zh-CN'
      setLanguage(settings.value.language)
    }
    
    if (cloudDriveResponse.success && 'data' in cloudDriveResponse && cloudDriveResponse.data) {
      cloudDriveSettings.value = {
        quark: (cloudDriveResponse.data as CloudDriveSettings).quark || [],
        uc: (cloudDriveResponse.data as CloudDriveSettings).uc || [],
        cloud123: (cloudDriveResponse.data as CloudDriveSettings).cloud123 || [],
        cloud115: (cloudDriveResponse.data as CloudDriveSettings).cloud115 || [],
        xunlei: (cloudDriveResponse.data as CloudDriveSettings).xunlei || []
      }
    }
    
    if (trimediaResponse.success && 'data' in trimediaResponse && trimediaResponse.data) {
      settings.value.trimediaHost = trimediaResponse.data.host || ''
      settings.value.trimediaUsername = trimediaResponse.data.username || ''
      settings.value.trimediaPassword = trimediaResponse.data.password || ''
      settings.value.trimediaEnabled = trimediaResponse.data.enabled || false
    }
  } catch (error) {
    devError('加载设置失败:', error)
  } finally {
    loading.value = false
  }
}

const loadCloudDriveSettings = async () => {
  try {
    const response = await $fetch('/api/settings/cloud-drive')
    if (response.success && 'data' in response && response.data) {
      cloudDriveSettings.value = {
        quark: (response.data as CloudDriveSettings).quark || [],
        uc: (response.data as CloudDriveSettings).uc || [],
        cloud123: (response.data as CloudDriveSettings).cloud123 || [],
        cloud115: (response.data as CloudDriveSettings).cloud115 || [],
        xunlei: (response.data as CloudDriveSettings).xunlei || []
      }
    }
  } catch (error) {
    devError('加载网盘设置失败:', error)
  }
}

const saveCloudDriveSettings = async () => {
  try {
    saving.value = true
    
    await $fetch('/api/settings/cloud-drive', {
      method: 'POST',
      body: cloudDriveSettings.value
    })
    
    clearSettingsCache()
    
    toast.add({
      severity: 'success',
      summary: t('success'),
      detail: t('save_cloud_drive_success'),
      life: 3000
    })
  } catch (error) {
    devError('保存网盘设置失败:', error)
    toast.add({
      severity: 'error',
      summary: t('error'),
      detail: t('save_cloud_drive_failed'),
      life: 3000
    })
  } finally {
    saving.value = false
  }
}

const addCloudDriveAccount = (type: keyof CloudDriveSettings) => {
  const newAccount: CloudDriveAccount = {
    id: Date.now().toString(),
    name: '',
    cookie: ''
  }
  const accounts = cloudDriveSettings.value[type]
  if (Array.isArray(accounts)) {
    accounts.push(newAccount)
  }
}

const openAddAccountDialog = (type: keyof CloudDriveSettings) => {
  accountDialogMode.value = 'add'
  currentEditingAccount.value = {
    type: type,
    index: null,
    account: {
      id: Date.now().toString(),
      name: '',
      cookie: ''
    }
  }
  accountDialogVisible.value = true
}

const openEditAccountDialog = (type: keyof CloudDriveSettings, index: number) => {
  const accounts = cloudDriveSettings.value[type]
  if (Array.isArray(accounts) && accounts[index]) {
    accountDialogMode.value = 'edit'
    currentEditingAccount.value = {
      type: type,
      index: index,
      account: { ...accounts[index] }
    }
    accountDialogVisible.value = true
  }
}

const saveAccountFromDialog = async () => {
  if (!checkDemoPermission()) return
  
  if (!currentEditingAccount.value.type) return
  
  const { type, index, account } = currentEditingAccount.value
  
  // 根据网盘类型验证不同的字段
  if (type === 'xunlei') {
    if (!account.refreshToken?.trim()) {
      toast.add({
        severity: 'error',
        summary: t('error'),
        detail: '请输入刷新Token',
        life: 3000
      })
      return
    }
    
    if (!account.captchaUserId?.trim()) {
      toast.add({
        severity: 'error',
        summary: t('error'),
        detail: '请输入用户ID',
        life: 3000
      })
      return
    }
  } else {
    if (!account.cookie?.trim()) {
      toast.add({
        severity: 'error',
        summary: t('error'),
        detail: '请输入Cookie',
        life: 3000
      })
      return
    }
  }
  
  try {
    saving.value = true
    
    let verifyResponse: { success: boolean; message?: string; nickname?: string }
    
    if (type === 'xunlei') {
      // 迅雷网盘验证
      verifyResponse = await $fetch<{ success: boolean; message?: string; nickname?: string }>('/api/cloud-drive/thunder/verify-config', {
        method: 'POST',
        body: {
          refreshToken: account.refreshToken,
          captchaUserId: account.captchaUserId
        }
      })
    } else {
      // 其他网盘验证
      const verifyApiPath = type === 'uc' 
        ? '/api/cloud-drive/uc/verify-cookie'
        : '/api/cloud-drive/quark/verify-cookie'
      
      verifyResponse = await $fetch<{ success: boolean; message?: string; nickname?: string }>(verifyApiPath, {
        method: 'POST',
        body: {
          cookies: account.cookie
        }
      })
    }
    
    if (!verifyResponse.success) {
      toast.add({
        severity: 'error',
        summary: t('error'),
        detail: verifyResponse.message || (type === 'xunlei' ? '配置验证失败' : 'Cookie验证失败'),
        life: 3000
      })
      return
    }
    
    if (!account.name.trim()) {
      account.name = verifyResponse.nickname || '未命名账号'
    }
    
    const accounts = cloudDriveSettings.value[type]
    if (Array.isArray(accounts)) {
      if (accountDialogMode.value === 'add') {
        accounts.push(account)
      } else if (accountDialogMode.value === 'edit' && index !== null) {
        accounts[index] = account
      }
    }
    
    accountDialogVisible.value = false
    
    toast.add({
      severity: 'success',
      summary: t('success'),
      detail: '账号验证成功',
      life: 3000
    })
    
    await saveCloudDriveSettings()
  } catch (error: any) {
    devError('验证Cookie失败:', error)
    toast.add({
      severity: 'error',
      summary: t('error'),
      detail: error.message || 'Cookie验证失败',
      life: 3000
    })
  } finally {
    saving.value = false
  }
}

const deleteCloudDriveAccount = async (type: keyof CloudDriveSettings, index: number) => {
  if (!checkDemoPermission()) return
  
  const accounts = cloudDriveSettings.value[type]
  if (Array.isArray(accounts)) {
    accounts.splice(index, 1)
  }
  
  // 自动保存
  await saveCloudDriveSettings()
}

// 保存TMDB设置
const saveTMDBSettings = async () => {
  if (!checkDemoPermission()) return
  
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

// 保存语言设置
const saveLanguageSettings = async () => {
  try {
    saving.value = true
    
    const response = await $fetch('/api/settings/language', {
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
    
    const response = await $fetch('/api/settings/test-tmdb', {
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

const saveTrimeMediaSettings = async () => {
  if (!checkDemoPermission()) return
  
  try {
    saving.value = true
    
    await $fetch('/api/settings/trimedia', {
      method: 'POST',
      body: {
        host: settings.value.trimediaHost,
        username: settings.value.trimediaUsername,
        password: settings.value.trimediaPassword,
        enabled: settings.value.trimediaEnabled
      }
    })
    
    clearSettingsCache()
    
    toast.add({
      severity: 'success',
      summary: t('success'),
      detail: t('save_trimedia_success'),
      life: 3000
    })
  } catch (error) {
    devError('保存飞牛影视设置失败:', error)
    toast.add({
      severity: 'error',
      summary: t('error'),
      detail: t('save_trimedia_failed'),
      life: 3000
    })
  } finally {
    saving.value = false
  }
}

const testTrimeMedia = async () => {
  try {
    trimediaTestResult.value = null
    
    if (!settings.value.trimediaHost || !settings.value.trimediaUsername || !settings.value.trimediaPassword) {
      trimediaTestResult.value = {
        success: false,
        message: t('please_fill_all_fields')
      }
      return
    }
    
    const response = await $fetch('/api/trimedia/test-connection', {
      method: 'POST',
      body: {
        host: settings.value.trimediaHost,
        username: settings.value.trimediaUsername,
        password: settings.value.trimediaPassword
      }
    })
    
    trimediaTestResult.value = {
      success: response.success,
      message: t(response.message)
    }
  } catch (error) {
    devError('测试飞牛影视连接失败:', error)
    trimediaTestResult.value = {
      success: false,
      message: t('trimedia_connection_failed')
    }
  }
}

// 备份数据库
const handleBackup = async () => {
  if (!checkDemoPermission()) return
  
  try {
    backupLoading.value = true
    
    const response = await $fetch('/api/settings/backup', {
      method: 'GET'
    })
    
    // 创建下载链接
    const blob = new Blob([JSON.stringify(response, null, 2)], { type: 'application/json' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `movicloud-backup-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
    
    toast.add({
      severity: 'success',
      summary: t('success'),
      detail: t('backup_success'),
      life: 3000
    })
  } catch (error) {
    devError('备份失败:', error)
    toast.add({
      severity: 'error',
      summary: t('error'),
      detail: t('backup_failed'),
      life: 3000
    })
  } finally {
    backupLoading.value = false
  }
}

// 恢复数据库
const handleRestore = async () => {
  if (!checkDemoPermission()) return
  
  try {
    restoreLoading.value = true
    
    const fileInput = restoreFileInput.value
    if (!fileInput || !fileInput.files || fileInput.files.length === 0) {
      toast.add({
        severity: 'error',
        summary: t('error'),
        detail: t('please_select_backup_file'),
        life: 3000
      })
      return
    }
    
    const file = fileInput.files[0]
    const formData = new FormData()
    formData.append('file', file)
    
    await $fetch('/api/settings/restore', {
      method: 'POST',
      body: formData
    })
    
    toast.add({
      severity: 'success',
      summary: t('success'),
      detail: t('restore_success'),
      life: 3000
    })
    
    // 清除文件输入
    fileInput.value = ''
    
    // 延迟一下，让用户看到成功提示
    setTimeout(() => {
      // 清除所有 localStorage
      localStorage.clear()
      
      // 清除 cookie
      document.cookie.split(";").forEach((c) => {
        document.cookie = c
          .replace(/^ +/, "")
          .replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
      })
      
      // 跳转到登录页
      router.push('/login')
    }, 1500)
  } catch (error: any) {
    devError('恢复失败:', error)
    toast.add({
      severity: 'error',
      summary: t('error'),
      detail: error.data?.message ? t(error.data.message) : t('restore_failed'),
      life: 3000
    })
  } finally {
    restoreLoading.value = false
  }
}

const showRestoreFilePicker = () => {
  restoreFileInput.value?.click()
}

// 版本信息
interface VersionInfo {
  currentVersion: string
  latestVersion: string
  updateAvailable: boolean
  latestRelease: {
    tag_name: string
    name: string
    published_at: string
    html_url: string
    body: string
  } | null
}

const versionInfo = ref<VersionInfo>({
  currentVersion: '1.0.0',
  latestVersion: '1.0.0',
  updateAvailable: false,
  latestRelease: null
})
const versionLoading = ref(false)

const fetchVersionInfo = async () => {
  versionLoading.value = true
  try {
    const response = await $fetch('/api/version')
    if (response.success) {
      versionInfo.value = {
        currentVersion: response.currentVersion,
        latestVersion: response.latestVersion,
        updateAvailable: response.updateAvailable,
        latestRelease: response.latestRelease
      }
    } else {
      // 即使 success 为 false，也更新显示（至少显示当前版本）
      versionInfo.value = {
        currentVersion: response.currentVersion || '1.0.6',
        latestVersion: response.latestVersion || '1.0.6',
        updateAvailable: false,
        latestRelease: null
      }
    }
  } catch (error) {
    devError('获取版本信息失败:', error)
    // 出错时至少显示当前版本
    versionInfo.value = {
      currentVersion: '1.0.6',
      latestVersion: '1.0.6',
      updateAvailable: false,
      latestRelease: null
    }
  } finally {
    versionLoading.value = false
  }
}

// 页面加载时获取数据
onMounted(async () => {
  // 初始化语言设置
  await initLanguage()
  // 加载其他设置
  loadSettings()
  // 获取版本信息
  if (activeTab.value === 'about') {
    fetchVersionInfo()
  }
})

// 监听选项卡切换，如果是关于页面则获取版本信息
watch(activeTab, (newTab) => {
  if (newTab === 'about' && !versionInfo.value.latestRelease) {
    fetchVersionInfo()
  }
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
                class="w-full"
              >
                <template #option="slotProps">
                  <div class="flex items-center gap-2">
                    <i :class="slotProps.option.icon" class="text-lg"></i>
                    <span>{{ slotProps.option.label }}</span>
                  </div>
                </template>
              </SelectButton>
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
        
        <!-- 飞牛影视设置选项卡 -->
        <div v-if="activeTab === 'trimedia'" class="bg-surface-200 dark:bg-surface-800 rounded-lg shadow-sm p-6">
          <h3 class="text-xl font-semibold text-surface-900 dark:text-surface-0 mb-6">{{ t('trimedia_settings') }}</h3>
          
          <div v-if="loading" class="text-center py-8">
            <i class="pi pi-spin pi-spinner text-2xl text-primary-500"></i>
            <p class="mt-2 text-surface-600 dark:text-surface-400">{{ t('loading_settings') }}</p>
          </div>
          
          <div v-else class="space-y-6">
            <!-- 启用开关 -->
            <div class="mb-6">
              <h4 class="font-medium text-surface-900 dark:text-surface-0 mb-4">{{ t('enable_trimedia') }}</h4>
              <SelectButton
                v-model="settings.trimediaEnabled"
                :options="trimediaEnabledOptions"
                optionLabel="label"
                optionValue="value"
                :multiple="false"
                :allowEmpty="false"
                :unselectable="false"
                class="w-full"
              >
                <template #option="slotProps">
                  <div class="flex items-center gap-2">
                    <i :class="slotProps.option.icon" class="text-lg"></i>
                    <span>{{ slotProps.option.label }}</span>
                  </div>
                </template>
              </SelectButton>
            </div>
            
            <div>
              <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                {{ t('trimedia_host') }}
              </label>
              <InputText
                v-model="settings.trimediaHost"
                type="text"
                :placeholder="t('trimedia_host_placeholder')"
                class="w-full"
              />
              <p class="text-xs text-surface-500 mt-1">{{ t('trimedia_host_hint') }}</p>
            </div>
            
            <div>
              <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                {{ t('trimedia_username') }}
              </label>
              <InputText
                v-model="settings.trimediaUsername"
                type="text"
                :placeholder="t('trimedia_username_placeholder')"
                class="w-full"
              />
            </div>
            
            <div>
              <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                {{ t('trimedia_password') }}
              </label>
              <InputText
                v-model="settings.trimediaPassword"
                type="password"
                :placeholder="t('trimedia_password_placeholder')"
                class="w-full"
              />
            </div>
            
            <div class="flex gap-3">
              <button
                @click="testTrimeMedia"
                :disabled="!settings.trimediaHost || !settings.trimediaUsername || !settings.trimediaPassword"
                class="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {{ t('test_api_connection') }}
              </button>
              
              <button
                @click="saveTrimeMediaSettings"
                :disabled="saving"
                class="px-6 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <i v-if="saving" class="pi pi-spin pi-spinner mr-2"></i>
                {{ saving ? t('saving') : t('save_settings') }}
              </button>
            </div>
            
            <!-- 测试结果 -->
            <div v-if="trimediaTestResult" class="p-4 rounded-lg" :class="trimediaTestResult.success ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400' : 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400'">
              <div class="flex items-center">
                <i :class="trimediaTestResult.success ? 'pi pi-check-circle' : 'pi pi-exclamation-triangle'" class="mr-2"></i>
                <span>{{ trimediaTestResult.message }}</span>
              </div>
            </div>
          </div>
        </div>
        
        <!-- 网盘设置选项卡 -->
        <div v-if="activeTab === 'cloud-drive'" class="bg-surface-200 dark:bg-surface-800 rounded-2xl shadow-lg p-6">
          <div class="flex justify-between items-start mb-8">
            <div>
              <h3 class="text-xl font-bold text-surface-900 dark:text-surface-0 mb-1">{{ t('cloud_drive_settings') }}</h3>
              <p class="text-sm text-surface-600 dark:text-surface-400">{{ t('cloud_drive_settings_subtitle') }}</p>
            </div>
            <button
              @click="openAddAccountDialog(activeCloudDriveTab as keyof CloudDriveSettings)"
              class="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-xl hover:from-primary-600 hover:to-primary-700 hover:shadow-lg transition-all duration-200"
            >
              <i class="pi pi-plus"></i>
              <span class="font-medium">{{ t('add_account') }}</span>
            </button>
          </div>
          
          <div v-if="loading" class="text-center py-12">
            <div class="w-16 h-16 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center mx-auto mb-4">
              <i class="pi pi-spin pi-spinner text-3xl text-primary-500"></i>
            </div>
            <p class="text-surface-600 dark:text-surface-400">{{ t('loading_settings') }}</p>
          </div>
          
          <div v-else>
            <!-- 网盘子选项卡 -->
            <div class="mb-8">
              <SelectButton
                v-model="activeCloudDriveTab"
                :options="cloudDriveOptions"
                optionLabel="label"
                optionValue="value"
                dataKey="value"
                :multiple="false"
                :allowEmpty="false"
                :unselectable="false"
                class="w-full"
              >
                <template #option="slotProps">
                  <div class="flex items-center gap-2">
                    <img
                      v-if="getDriveByCode(slotProps.option.value)?.logo"
                      :src="getDriveByCode(slotProps.option.value)?.logo"
                      :alt="slotProps.option.label"
                      class="w-5 h-5 rounded-md"
                    />
                    <span>{{ slotProps.option.label }}</span>
                  </div>
                </template>
              </SelectButton>
            </div>
            
            <!-- 夸克网盘设置 -->
            <div v-if="activeCloudDriveTab === 'quark'" class="space-y-4">
              <div v-if="!cloudDriveSettings.quark || cloudDriveSettings.quark.length === 0" class="text-center py-16">
                <div class="w-24 h-24 rounded-2xl bg-surface-100 dark:bg-surface-700/30 flex items-center justify-center mx-auto mb-6">
                  <i class="pi pi-cloud text-5xl text-surface-400 dark:text-surface-500"></i>
                </div>
                <h4 class="text-lg font-medium text-surface-700 dark:text-surface-300 mb-2">还没有账号</h4>
                <p class="text-surface-500 dark:text-surface-400 mb-6">点击上方按钮添加您的第一个账号</p>
              </div>
              
              <div v-else class="space-y-4">
                <div
                  v-for="(account, index) in (cloudDriveSettings.quark || [])"
                  :key="account.id"
                  class="group bg-surface-50 dark:bg-surface-700/50 rounded-2xl p-5 hover:bg-surface-100 dark:hover:bg-surface-700 transition-all duration-200"
                >
                  <div class="flex items-center justify-between">
                    <div class="flex items-center gap-4">
                      <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center">
                        <i class="pi pi-user text-white text-2xl"></i>
                      </div>
                      <div>
                        <h5 class="font-semibold text-lg text-surface-900 dark:text-surface-0">{{ account.name || '未命名账号' }}</h5>
                      </div>
                    </div>
                    <div class="flex items-center gap-2">
                      <button
                        @click="openEditAccountDialog('quark', index)"
                        class="w-10 h-10 rounded-xl flex items-center justify-center text-surface-500 dark:text-surface-400 hover:text-primary-500 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-all duration-200"
                        :title="t('edit')"
                      >
                        <i class="pi pi-pencil text-lg"></i>
                      </button>
                      <button
                        @click="deleteCloudDriveAccount('quark', index)"
                        class="w-10 h-10 rounded-xl flex items-center justify-center text-surface-500 dark:text-surface-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-200"
                        :title="t('delete_cloud_account')"
                      >
                        <i class="pi pi-trash text-lg"></i>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- UC网盘设置 -->
            <div v-else-if="activeCloudDriveTab === 'uc'" class="space-y-4">
              
              <div v-if="!cloudDriveSettings.uc || cloudDriveSettings.uc.length === 0" class="text-center py-16">
                <div class="w-24 h-24 rounded-2xl bg-surface-100 dark:bg-surface-700/30 flex items-center justify-center mx-auto mb-6">
                  <i class="pi pi-cloud text-5xl text-surface-400 dark:text-surface-500"></i>
                </div>
                <h4 class="text-lg font-medium text-surface-700 dark:text-surface-300 mb-2">还没有账号</h4>
                <p class="text-surface-500 dark:text-surface-400 mb-6">点击上方按钮添加您的第一个账号</p>
              </div>
              
              <div v-else class="space-y-4">
                <div
                  v-for="(account, index) in (cloudDriveSettings.uc || [])"
                  :key="account.id"
                  class="group bg-surface-50 dark:bg-surface-700/50 rounded-2xl p-5 hover:bg-surface-100 dark:hover:bg-surface-700 transition-all duration-200"
                >
                  <div class="flex items-center justify-between">
                    <div class="flex items-center gap-4">
                      <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center">
                        <i class="pi pi-user text-white text-2xl"></i>
                      </div>
                      <div>
                        <h5 class="font-semibold text-lg text-surface-900 dark:text-surface-0">{{ account.name || '未命名账号' }}</h5>
                      </div>
                    </div>
                    <div class="flex items-center gap-2">
                      <button
                        @click="openEditAccountDialog('uc', index)"
                        class="w-10 h-10 rounded-xl flex items-center justify-center text-surface-500 dark:text-surface-400 hover:text-primary-500 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-all duration-200"
                        :title="t('edit')"
                      >
                        <i class="pi pi-pencil text-lg"></i>
                      </button>
                      <button
                        @click="deleteCloudDriveAccount('uc', index)"
                        class="w-10 h-10 rounded-xl flex items-center justify-center text-surface-500 dark:text-surface-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-200"
                        :title="t('delete_cloud_account')"
                      >
                        <i class="pi pi-trash text-lg"></i>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- 迅雷网盘设置 -->
            <div v-else-if="activeCloudDriveTab === 'xunlei'" class="space-y-4">
              
              <div v-if="!cloudDriveSettings.xunlei || cloudDriveSettings.xunlei.length === 0" class="text-center py-16">
                <div class="w-24 h-24 rounded-2xl bg-surface-100 dark:bg-surface-700/30 flex items-center justify-center mx-auto mb-6">
                  <i class="pi pi-cloud text-5xl text-surface-400 dark:text-surface-500"></i>
                </div>
                <h4 class="text-lg font-medium text-surface-700 dark:text-surface-300 mb-2">还没有账号</h4>
                <p class="text-surface-500 dark:text-surface-400 mb-6">点击上方按钮添加您的第一个账号</p>
              </div>
              
              <div v-else class="space-y-4">
                <div
                  v-for="(account, index) in (cloudDriveSettings.xunlei || [])"
                  :key="account.id"
                  class="group bg-surface-50 dark:bg-surface-700/50 rounded-2xl p-5 hover:bg-surface-100 dark:hover:bg-surface-700 transition-all duration-200"
                >
                  <div class="flex items-center justify-between">
                    <div class="flex items-center gap-4">
                      <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center">
                        <i class="pi pi-user text-white text-2xl"></i>
                      </div>
                      <div>
                        <h5 class="font-semibold text-lg text-surface-900 dark:text-surface-0">{{ account.name || '未命名账号' }}</h5>
                      </div>
                    </div>
                    <div class="flex items-center gap-2">
                      <button
                        @click="openEditAccountDialog('xunlei', index)"
                        class="w-10 h-10 rounded-xl flex items-center justify-center text-surface-500 dark:text-surface-400 hover:text-primary-500 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-all duration-200"
                        :title="t('edit')"
                      >
                        <i class="pi pi-pencil text-lg"></i>
                      </button>
                      <button
                        @click="deleteCloudDriveAccount('xunlei', index)"
                        class="w-10 h-10 rounded-xl flex items-center justify-center text-surface-500 dark:text-surface-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-200"
                        :title="t('delete_cloud_account')"
                      >
                        <i class="pi pi-trash text-lg"></i>
                      </button>
                    </div>
                  </div>
                </div>
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
            <!-- 备份功能 -->
            <div class="bg-surface-50 dark:bg-surface-700 rounded-lg p-4">
              <h4 class="font-medium text-surface-900 dark:text-surface-0 mb-2">{{ t('backup_database') }}</h4>
              <p class="text-sm text-surface-600 dark:text-surface-400 mb-4">{{ t('backup_description') }}</p>
              <button 
                @click="handleBackup"
                :disabled="backupLoading"
                class="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <i v-if="backupLoading" class="pi pi-spin pi-spinner mr-2"></i>
                <i v-else class="pi pi-download mr-2"></i>
                {{ backupLoading ? t('backing_up') : t('backup_now') }}
              </button>
            </div>
            
            <!-- 恢复功能 -->
            <div class="bg-surface-50 dark:bg-surface-700 rounded-lg p-4">
              <h4 class="font-medium text-surface-900 dark:text-surface-0 mb-2">{{ t('restore_database') }}</h4>
              <p class="text-sm text-surface-600 dark:text-surface-400 mb-4">{{ t('restore_description') }}</p>
              <input
                ref="restoreFileInput"
                type="file"
                accept=".json"
                class="hidden"
                @change="(e) => {
                  const file = (e.target as HTMLInputElement).files?.[0]
                  if (file) {
                    handleRestore()
                  }
                }"
              />
              <button 
                @click="showRestoreFilePicker"
                :disabled="restoreLoading"
                class="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <i v-if="restoreLoading" class="pi pi-spin pi-spinner mr-2"></i>
                <i v-else class="pi pi-upload mr-2"></i>
                {{ restoreLoading ? t('restoring') : t('restore_now') }}
              </button>
            </div>
          </div>
        </div>
        
        <!-- 关于 MoviCloud 选项卡 -->
        <div v-if="activeTab === 'about'" class="bg-surface-200  dark:bg-surface-800 rounded-lg shadow-sm p-6">
          <h3 class="text-xl font-semibold text-surface-900 dark:text-surface-0 mb-6">{{ t('about_movicloud') }}</h3>
          
          <div class="space-y-6">
            <!-- Logo -->
            <div class="flex flex-col items-center justify-center py-4">
              <div class="flex flex-row items-center justify-center gap-6 mb-3">
                <!-- 图标 SVG -->
                <svg
                  class="w-32 h-32 text-primary-500 flex-shrink-0"
                  viewBox="0 0 308.3 291.8"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <g>
                    <g>
                      <circle class="fill-current opacity-80" cx="154.15" cy="60.83" r="24.16"/>
                      <path class="fill-current opacity-80" d="M187.48,9h0c-10-5.83-21.5-9-33.33-9s-23.33,3.17-33.33,9h0c-10,5.83-18.5,14.17-24.5,24.5h0l19.33,11.17c4-6.83,9.67-12.5,16.33-16.33h0c6.67-3.83,14.17-5.83,22.16-5.83s15.66,2.17,22.16,5.83h0c6.67,3.83,12.33,9.33,16.33,16.33l19.33-11.17c-6-10.5-14.5-18.83-24.5-24.5Z"/>
                    </g>
                    <path class="fill-current" d="M295.47,94.16c-8.5-17.83-20.83-33.83-36.16-46.99h0l-3.17-2.67h-35.83l-2.83,7.17c-5.67,14.83-14.83,27.5-26.33,36-10.67,8.17-23.5,12.83-37.16,12.83s-26.5-4.67-37.16-12.83c-11.33-8.67-20.5-21.16-26.33-36l-2.83-7.17h-35.5l-3.17,2.67c-15.33,13.17-27.66,29-36.16,46.99C4.67,111.49,0,130.49,0,150.48c0,39.16,17.33,74.66,45.5,100.32,27.83,25.33,66.33,41,108.65,41s80.82-15.66,108.65-41c28.16-25.66,45.5-61.16,45.5-100.32,0-20-4.5-39-12.83-56.33ZM206.81,127.32c13.33,0,24.16,10.83,24.16,24.16s-10.83,24.16-24.16,24.16-24.16-10.83-24.16-24.16,10.83-24.16,24.16-24.16ZM86.49,137.65c0-11.67,10.33-13.83,18.66-7h0l16.5,13.5c5.33,4.33,5.33,11.5,0,16l-16.5,13.5c-7.17,5.83-18.66,5.5-18.66-5.83,0,0,0-30.16,0-30.16ZM247.64,234.31c-23.83,21.66-56.99,35.16-93.49,35.16s-69.66-13.5-93.49-35.16c-23.66-21.5-38.16-51.16-38.16-83.66,0-16.66,3.83-32.5,10.5-46.83,6.5-13.83,15.83-26.16,27.33-36.83h12.33c.83,1.67,1.67,3.5,2.5,5.17-23.5,18-38.33,44-38.33,72.99,0,54.33,52.49,98.49,117.32,98.49s117.32-44.16,117.32-98.49c0-29-14.83-54.99-38.5-72.99.83-1.67,1.83-3.33,2.5-5.17h12.33c11.5,10.5,20.83,23,27.33,36.83h0c6.83,14.33,10.5,30.16,10.5,46.83.17,32.5-14.33,62.16-38,83.66Z"/>
                  </g>
                </svg>
                <!-- 文字 SVG -->
                <svg
                  class="h-20 text-primary-500 flex-shrink-0"
                  viewBox="0 0 449.72 195.64"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <g>
                    <g>
                      <path class="fill-current stroke-current" style="stroke-width: .21px; stroke-miterlimit: 6.02;" d="M30.8,111.3c-.49-.17-.99-.34-1.49-.5h0c-2.25-.67-4.83-1.46-7.75-2.38h0c-.16-.33-.33-.41-.5-.24h0c-.5-.17-.92-.59-1.25-1.25h0c.33-.83,2.12-4,5.37-9.49h0c.17-2.92.34-4.79.5-5.62h0c.17-.83.17-1.41,0-1.74h0c-3.91-.33-7.74-.41-11.47-.24h0c.5.49,1.5,1.61,2.99,3.37h0c.08.49.29,1.07.62,1.74h0c.5.83.34,2.04-.5,3.62h0c-2.25,3.16-5.24,6.03-8.98,8.6h0l-.75.26c-1.91-1-3.37-2-4.38-2.99h0c-1.07-.92-1.82-1.8-2.24-2.63-.41-.83-.62-1.83-.62-2.99H.36c0-.75.12-1.25.36-1.49.25-.25,1-.88,2.26-1.88h0c2.33-1.74,4.45-3.45,6.36-5.11h0l1.5-.75c-2.17-2.08-3.41-3.45-3.74-4.12h0c0-2.58.25-5.11.74-7.61h0c.5-1.41.75-3.24.75-5.49h0c.17-2,.34-3.16.5-3.5h0c.34-.33.76-.83,1.25-1.49h0c.67-.92,1.57-1.46,2.69-1.62,1.12-.17,5.76-.26,13.91-.26h0c8.74-.16,17.81-.49,27.21-.99h0l1.25.5c1,.66,2.63,1.95,4.87,3.87h0v11.49l-.75,1.49c-1.08,2.42-2.21,4.21-3.37,5.37h0c-2.25.75-5.16,1.29-8.74,1.62h0c-1.82.17-3.05.34-3.68.5-.62.17-1.1.51-1.43,1.01h0l-.5.75-.26,6.11c0,3.41-.08,5.47-.24,6.18-.17.71-.67,1.73-1.5,3.05h0c-1.24,1.75-2.62,3.09-4.12,4-1.49.91-3.12,1.2-4.87.87h0ZM35.93,78.85c1.74-.16,3.53-.33,5.37-.5h0c1.9-.17,3.27-.48,4.11-.93.83-.46,1-1.11.51-1.94h0c-7.16-.33-15.02-.25-23.6.26h0l-.99.24-.26,1.01c0,.74.25,1.24.75,1.49.5.25,2.21.46,5.11.63h0c4,.16,7,.08,8.99-.26h0ZM55.15,107.44c-1.08-.67-2.46-1.42-4.12-2.26h0c-1.49-.99-2.7-1.7-3.62-2.12h0c-.99-.5-1.49-1.56-1.49-3.17s.58-3.27,1.74-4.93h0c.58-.83.96-1.54,1.13-2.12h0c.33-1,.99-1.92,1.99-2.75h0c1.5,0,2.8.17,3.88.5h0c.49.34,1.32.76,2.5,1.25h0c1.74.5,3.16,1.11,4.24,1.82,1.08.7,1.87,1.39,2.36,2.06h0c.17,1.74-.25,3.78-1.25,6.11h0c-.33.33-.5.75-.5,1.25h0c-.16.58-.58,1.12-1.25,1.62h0c-.33.17-.66.59-.99,1.25h0c-.33,1-.85,1.63-1.56,1.88-.7.25-1.72.13-3.05-.38h0ZM71,105.69c-.83-.5-1.68-1.69-2.56-3.56-.88-1.87-1.57-4.1-2.06-6.68h0c-.17-1.33-.42-2.37-.75-3.11h0c-.5-1.17-.42-2.42.26-3.74h0c.49-1.08.9-1.83,1.23-2.26.34-.41.76-.62,1.25-.62h0c1.75-.33,4.17-.67,7.25-1.01h0c3.41-.66,6.74-1.62,9.99-2.87h0c4.57-2.33,9.6-5.19,15.1-8.6h0c.66.66,1.08,1.16,1.25,1.49h0c1.16,1.33,2.33,2.71,3.49,4.12h0c.42.33.51.5.26.5h0c-.33,0-.5.09-.5.26h0c0,.17.17.26.5.26h0c.08,0,.33.33.75.99.41.66,1.03,1.95,1.86,3.87h0c.33,1,.54,1.67.63,2,.08.33.04.5-.14.5h0c-.16.5-.08,1.21.26,2.12h0c.33.83.29,1.46-.12,1.88-.42.41-1.38,1.03-2.87,1.86h0c-1.08.42-2.46,1.13-4.12,2.12h0c-3.41,1.83-9.07,4.21-16.98,7.11h0c-5.57,2.09-9.05,3.29-10.42,3.62-1.37.33-2.56.25-3.55-.24h0ZM73.74,73.73c-.33-.17-.99-.5-1.99-.99h0c-1-.42-1.59-.88-1.76-1.38h0c-.33-.49-.79-1.15-1.37-1.99h0l-1.25-1.01-.5-2.12c-.66-3.58-.91-6.45-.75-8.62h0c.17-.49.67-.88,1.5-1.17.83-.29,2.37-.69,4.62-1.19h0c5.15-1.5,9.44-2.96,12.86-4.38h0c3.41-1.49,6.69-3.11,9.85-4.86h0l1.13-1.25h1.49c.83.16,1.42.41,1.76.74.33.34.87,1.05,1.62,2.14h0c.66.99,1.16,1.82,1.49,2.5h0c1.16,2.41,1.83,5.31,2,8.72h0c-.66,1.83-1.91,3.29-3.74,4.38h0c-6.16,2.75-13.77,5.99-22.84,9.73h0c-1.66.5-2.68.79-3.05.87-.37.09-.73.05-1.07-.12h0ZM2.48,63.75c-.5-.17-.79-.42-.87-.75h0c-.5-1.41-.92-3.37-1.25-5.87H.36l-.26-2.12.99-2.24-.5-.75c-.5-.91-.34-1.62.5-2.12h0c1.58-.33,3.75-.33,6.5,0h0c6.08.33,11.44.33,16.09,0h0c.34-1.33.43-2.62.26-3.87h0c-.91-.17-5.53-.34-13.85-.51h0c-1.33-1.66-2.25-2.74-2.75-3.23h0c-1.24-1.41-2.2-3.29-2.87-5.62h0c0-9.4.75-19.22,2.26-29.45h0c.16-1.17.37-2.3.62-3.37h0l.26-1.25c17.89.33,33.2.5,45.93.5h1.13l1.74,1.25c1.66,1.41,2.64,2.29,2.93,2.62.29.33.52.83.68,1.5h0c.17,9.74-.16,20.13-.99,31.19h0c-.75,1.58-1.79,3.04-3.11,4.38h0c-1,.16-2.54.33-4.62.5h0c-5.33.33-9.08.75-11.23,1.25h0c-.34,1.25-.43,2.46-.26,3.62h0c3.74-.17,8.77-.51,15.1-1.01h0c2.34-.33,3.81-.41,4.44-.24.62.16,1.43.58,2.44,1.25h0l.99,1.25c.5,2.08.75,3.45.75,4.12h0v2.86h0l-1.74,1.76c-.83.83-1.5,1.37-2,1.62-.5.24-1.87.53-4.12.87h0c-6.16.58-17.26,1.12-33.33,1.61h0c-11.23.34-17.84.43-19.84.26h0ZM37.18,33.05h5.61c.42-1.33.71-2.21.87-2.63h0v-.99c-6.99.16-12.56.33-16.72.5h0c-3.58.17-5.66.3-6.24.38-.58.08-.87.41-.87.99h0c0,1,1.1,1.63,3.31,1.88,2.21.25,6.89.21,14.05-.12h0ZM40.79,19.44c1.33-.17,2.19-.34,2.57-.5.37-.17.56-.51.56-1.01h0v-.5c-8.4-.33-15.48-.41-21.22-.24h0c-.91.33-1.37.83-1.37,1.49h0v1.01h1.86c5.74.16,11.61.08,17.6-.26h0ZM70.74,44.78c-1.91-2.34-3.37-4.46-4.36-6.38h0c-.83-3.08-1.29-5.18-1.38-6.3-.08-1.12.05-2.1.38-2.93h0c.34-.66.84-1.16,1.5-1.49.66-.34,2.29-1.01,4.87-2h0c7.65-3.08,13.81-6.41,18.47-9.99h0c.99-.91,1.7-1.41,2.12-1.5.41-.08,1.2.05,2.38.38h0c1.41.42,2.54,1.54,3.37,3.37h0c.49,1,1.07,1.96,1.74,2.87h0l1.13,1.25v1.25c.16,1.58.49,2.71.99,3.37h0c.33.17.25.34-.26.5h0c-.49-.16-.49.01,0,.51h0c.5.66.42,1.7-.24,3.11h0l-.5,1.25c-3.58,1.83-6.25,3.21-8,4.12h0c-5.65,2.67-11.43,5.45-17.34,8.36h0c-1.58.83-2.71,1.33-3.37,1.5h0c-.33-.17-.83-.59-1.5-1.25h0Z"/>
                      <path class="fill-current stroke-current" style="stroke-width: .21px; stroke-miterlimit: 6.02;" d="M200.9,108.69c-4.82-1.66-9.19-4.7-13.1-9.11h0c-1.17-1.58-2.01-3.7-2.5-6.36h0c-.5-3.08-.84-4.83-1.01-5.25h0c-.41.25-1.2,1.04-2.38,2.38h0c-4.57,5.07-8.73,8.9-12.47,11.47h0c-1.91.83-4.08,1.46-6.5,1.88h0l-2.99.24-1.74-.87c-.75-.83-1.46-1.58-2.12-2.24h0c-2.75-4.91-4.7-8.99-5.87-12.23h0c.33-.34.91-.88,1.74-1.62h0c.74-.83,1.53-1.41,2.36-1.74.83-.34,2.29-.76,4.38-1.25h0c2.83-.67,5.36-2.13,7.61-4.38h0c2.09-2.25,3.88-5.32,5.37-9.23h0c.66-1.83.99-2.9.99-3.19s-.33-.35-.99-.18h0c-1,.25-1.92.46-2.75.62h0c-.41-.16-.78-.16-1.11,0h0c-1.66.5-3.2,1-4.62,1.5h0c-1.33.17-3.04-.25-5.13-1.25h0c-.66-.58-1.16-1.54-1.49-2.87h0c0-.83-.09-1.33-.26-1.5h0c-.16.17-.08.92.26,2.26h0c.16,2.91-.09,5.24-.75,6.99h0c-2.75.33-5.45.33-8.11,0h0c-.42-.17-1.55-.55-3.38-1.13h0l-.24-3.49c-.17-4.08.99-7.41,3.49-9.99h0c.92-.83,1.63-1.27,2.12-1.32.5-.04,1.33.07,2.5.32h0c1.75.67,2.8,1.5,3.13,2.5h0c.16.33.33.58.5.75h0c0-1.66.09-5.16.26-10.48h0c0-7.66.58-15.48,1.74-23.46h0c.74-5.66,1.45-9.7,2.12-12.11h0c.99-1.16,2.37-1.91,4.12-2.26h0c4.57.5,10.02.84,16.35,1.01h0c8.15,0,15.72-.42,22.71-1.25h0c2.42-.5,5,.16,7.75,1.99h0c3.41,2.59,5.78,5.42,7.11,8.5h0c.33,1.82.25,6.32-.26,13.47h0c-.33,3.25-.58,6.66-.74,10.24h0c-.67,7.57-1.55,13.47-2.63,17.72h0c-.33,1.16-.66,1.91-.99,2.24-.33.34-.83.51-1.5.51h0c-.99.16-1.95.53-2.87,1.11h0c-1.16.17-2.7-.12-4.62-.87h0c-2.33-.99-4.28-1.82-5.87-2.5h0c-.33-.33-.83-.5-1.49-.5h-1.25c-.17,0-.26-.89-.26-2.68s.17-3.31.5-4.56h0c1.33-10.9,1.75-19.39,1.25-25.46h0l-.24-.63h-9.23c-7,0-11.08.15-12.24.44-1.16.29-1.78,1.44-1.86,3.44h0c-.5,11.39-.67,21.04-.5,28.95h0c1.24-5.49,2.28-13.11,3.11-22.84h0l.26-3.49c3.41.16,5.86.41,7.35.75h0c1.25.49,2.55.82,3.88.99h0c1.9.5,3.27,1.17,4.11,2h0l1.01.62c-.33,7.82-.75,13.86-1.25,18.11h0c-.33,1.74-.58,4.32-.75,7.73h.99c2.59,1,5.33,2.25,8.24,3.74h0v13.35l.75,1.25c1,1.16,2.17,2.12,3.49,2.87h0c1.91-.25,4.5-1.62,7.75-4.12h0c1.33-1.24,2.27-1.95,2.81-2.12.54-.17,1.39-.09,2.56.26h0c2.08.91,3.78,2.45,5.11,4.62h0c1.66,2.58,2.81,5.09,3.43,7.55.62,2.46.69,4.14.2,5.05h0c-4.16,2.75-9.82,5.62-16.98,8.62h0c-2.5.41-5.28.58-8.36.5h0ZM128.01,106.94c-1.41-.83-2.79-1.83-4.12-3.01h0c-.49-.41-.82-1.28-.99-2.62h0l-.26-2.24,1.25-6.24c.17-9.83.17-15.36,0-16.6h0c-.49,0-1.28.17-2.36.5h0c-3,.33-5.37.25-7.11-.24h0c-.5-.5-1.08-1.42-1.74-2.75h0c-.5-1.08-1.02-2.04-1.56-2.87-.54-.83-.98-1.25-1.31-1.25h0c-.5-.99-.59-2.2-.26-3.62h0c.17-.49.26-1.07.26-1.74h0c0-.83.48-1.52,1.43-2.06.96-.54,2.36-.89,4.18-1.05h0c1.25,0,2.34-.25,3.25-.75.91-.5,2.08-1.5,3.49-2.99h0c3.75-4.16,6.46-7.95,8.12-11.35h0l.24-.75-2.74.24c-4,.17-6.83.13-8.5-.12-1.66-.25-2.87-.87-3.61-1.86h0l-.5-1.01-.26-2.87c.17-3.91.67-7.74,1.5-11.47h0l.12-.75c2.66.17,5.36.42,8.11.75h0c6.99.5,13.31,1,18.98,1.49h0l2.5.51c2.41,2.91,4.28,5.4,5.61,7.49h0l.75,1.49-.26,2.12c-.33,2.17-1.16,4.04-2.5,5.62h0c-1.57,2.17-3.19,4.54-4.86,7.11h0c-1.75,3.24-2.51,6.81-2.26,10.72h0c.34,3.75.76,8,1.25,12.74h0c.33,9.74.33,18.1,0,25.09h0c-1.57,1.25-3.69,2.63-6.36,4.12h0c-.75.33-1.79.42-3.11.26h-6.38ZM130.76,23.81c-1.83-.16-3.21-.58-4.12-1.25h0c-.17,0-.46-.69-.87-2.06-.42-1.36-.71-2.63-.87-3.8h0c-.17-1.74-.09-3.61.24-5.61h0c.17-.75.34-1.54.51-2.38h0c.16-1.66.68-3.01,1.55-4.05.88-1.04,1.82-1.4,2.81-1.07h0c8.15,2.58,13.94,4.7,17.36,6.36h0c.25.75.33,1.63.24,2.63h0c-.33.82-.5,1.48-.5,1.99h0c-.33.42-.5,1.38-.5,2.87h0v2.75l-1.5,1.37c-1.49,1.33-3.36,2.08-5.61,2.24h0c-2.92.17-5.83.17-8.74,0h0Z"/>
                      <path class="fill-current stroke-current" style="stroke-width: .21px; stroke-miterlimit: 6.02;" d="M305.72,105.69c0-.34-.17-.51-.5-.51h0c-.5-.33-.59-1.04-.26-2.12h0l.26-.99c-1.58-3.41-2.87-5.87-3.87-7.37h0c-1.58-.83-3.46-1.16-5.62-.99h0c-.83.33-1.79.5-2.87.5h0c-1.66.17-2.89.34-3.68.5-.78.17-1.26.34-1.43.5h0c-2,.5-4.53,1.17-7.61,2h0c-6.66,1.91-14.6,4.04-23.84,6.36h0c-1.83-.49-3.21-.74-4.12-.74h-1.5l-1.25-.75c-3.08-3.41-5.28-7.32-6.62-11.73h0c-.33-2.42-.58-4.46-.74-6.12h0v-1.25l1.25-1.62c5.4-7.65,8.98-13.43,10.72-17.34h0v-1.01c-4.82-.16-9.19-.16-13.1,0h0c-1.5.33-2.73.06-3.68-.81-.95-.87-1.68-2.22-2.18-4.05h0c-.67-5.16-.84-10.03-.5-14.6h0c.33-1.58,1.06-2.75,2.18-3.5,1.12-.74,2.27-.87,3.43-.38h0c3.25.83,13.4.92,30.45.26h0c18.89-1.33,33.99-3.12,45.31-5.37h0c2.91-.66,5.61-1.16,8.11-1.49h1.37l1.01.5c.66,1.16,1.49,2.62,2.5,4.36h0c1.41,3.25,2.04,6.41,1.86,9.49h0c-.33.83-.5,1.91-.5,3.25h0l.26,2.12-2.38.99c-4.08,1.83-8.24,3.21-12.48,4.12h0c-1.58.17-3.12.42-4.62.75h0c-1.58.5-3.37.75-5.37.75h0c-3.08.16-5.91.33-8.48.5h0c-3.91.33-7.91.75-11.99,1.25h0c-2.25.16-3.58.33-4,.5-.41.17-.78.55-1.11,1.13h0c-1.75,4.24-3.96,9.35-6.62,15.34h0c0,.67.67.84,2,.51h0c6.49-.75,12.81-1.54,18.96-2.38h0l.75-.26v-1.25c-.17-.83-.67-2.2-1.5-4.11h0l.26-1.01c.83-1.91,2-3.37,3.49-4.36h0c.67-.34,1.21-.76,1.62-1.25h0c.33-.5.83-.75,1.5-.75h0c.99-.17,2.16-.88,3.49-2.12h0l.63-.5c1.16.49,2.08.74,2.74.74h0c.67,0,1.4.27,2.18.81.79.54,2.02,1.56,3.68,3.07h0c4.66,5.83,9.2,15.48,13.61,28.95h0c.33.66.66,1.33.99,2h0c.33.83.46,1.52.38,2.06s-.54,1.23-1.37,2.06h0c-.83.99-1.73,1.65-2.69,1.99-.95.34-1.59.26-1.92-.24h0v-.5l-.75.5c-1.24.5-2.37.67-3.37.5h0c0-.17-.29-.17-.87,0-.58.17-1.58.5-2.99.99h0c-3.75.92-6.54,1.71-8.36,2.38h0c-.34.17-.43.09-.26-.24h0ZM256.8,32.8l-5.37-.5-1.25-.75c-1.33-.75-2.21-1.38-2.62-1.88-.42-.49-.84-1.65-1.25-3.49h0l-1.01-3.11-.24-9.49.5-.99c.83-1.17,1.87-2.13,3.11-2.87h0l1.01-.51,5.37.26c14.81.17,26.91-.16,36.32-.99h0c4.9-1,11.14-1.92,18.71-2.75h0l.75.75c2,3.25,3.29,6.99,3.88,11.23h0v2.12c0,.25.08.38.24.38h0c.67.25.92,1.21.75,2.87h0c-.5,1.66-.96,2.87-1.37,3.61h0c-.67.5-1.94,1-3.8,1.5-1.87.5-4.27,1-7.19,1.49h0c-8.65,1.25-16.14,2.05-22.45,2.38h0c-6.33.33-14.36.58-24.09.75h0Z"/>
                      <path class="fill-current stroke-current" style="stroke-width: .21px; stroke-miterlimit: 6.02;" d="M350.12,111.3c-1.32-.66-2.4-1.49-3.23-2.5h0c-.17-.41-.42-.79-.75-1.13h0c-.08-.16-.17-.53-.26-1.11-.08-.58-.12-1.75-.12-3.5h0c0-2.33-.09-4.7-.26-7.11h0l.63-.24h.75v-1.01l-.26-.75c1.49-1.57,2.33-2.53,2.5-2.86h0c0-.17.56-.22,1.68-.14,1.12.09,2.27.3,3.43.63h0l2,.5.63-.75c.66-.66,1.08-1.6,1.25-2.81.16-1.2.33-3.59.5-7.17h0l.24-6.86c.83-2.25,1.42-3.78,1.76-4.62h0c.49-1.16,1.36-1.74,2.62-1.74h0c.99,0,1.57-.09,1.74-.26.17-.17-.08-.46-.75-.87h0c-.33-.33-.91-.58-1.74-.75h-1.13c-1.82-1.66-2.82-2.66-2.99-2.99h0c0-.33-.17-.5-.5-.5h0c-.5-.58-.59-1.29-.26-2.12h0c.5-.83,1.33-2.13,2.5-3.88h0c1.25-1.82,2.05-3.24,2.38-4.24h0c0-.33-.44-.46-1.31-.38-.87.09-2.39.47-4.56,1.13h0c-2.42.66-3.94.95-4.56.87-.62-.08-1.18-.62-1.68-1.62h0c-.66-2.41-1.33-5.07-2-7.99h0l-.5-2.5c.66-1.24,1.08-2.12,1.25-2.62h0c.17-1.66.59-2.87,1.25-3.62h0l.99-.5,2.63.26c4.9.16,9.23.08,12.98-.26h0l.87-.26c0-1.49.17-3.11.5-4.86h0c.33-3,0-5.79-.99-8.36h0c-.58-1.58-.87-2.59-.87-3.01s.29-.87.87-1.37h0c.66-.33,2.08-1.45,4.24-3.37h0l.62.26h4.75c2.75-2.17,4.66-3.5,5.73-4h0l1.5-.62v-2.5c.17-2.09,1-3.88,2.5-5.37h0l1.62-1.74h1.49c4.25.99,7.41,2.32,9.49,3.99h0l1.01,1.37.24,5.88-.5.24c-.33.17-.08.26.75.26h0c1.49,0,5.73.25,12.72.75h0l3.13-.51c3.58-.66,6.91-.83,9.99-.5h0c1.32.5,2.53,1.5,3.61,2.99h0c1.33,3.83,2.42,9.2,3.25,16.11h0v2.87l1.01-.26c3.82-.33,7.52.71,11.1,3.13h0l2.26,1.49-1.5.26c-.83.16-1.35.37-1.56.62s-.23.63-.06,1.13h0c.42,1.24.55,2.28.38,3.11h0c-.08.34-.29,1.01-.63,2h0l.63.26c.33.33.58.58.75.75h0c0,.25.08.38.24.38h0c.17,0,.17.17,0,.5h0c-1.57.5-3.03,1.08-4.36,1.74h0c-1.91.5-4.58,1.17-7.99,2h0c-.33,1.91-.58,5.66-.75,11.23h0c-1,1.24-1.83,2.45-2.5,3.61h0c-.75,1.25-1.62,1.96-2.62,2.12h0c-.34,0-.68.17-1.01.51h0l-.5.5c1.16.16,2.54.33,4.12.5h0l3.25.26,1.11.74c2.17,1.5,3.6,3.21,4.32,5.13.7,1.9.89,4.65.56,8.23h0c-.25,3.08-.46,5.2-.62,6.38h0c1.24.16,2.95.41,5.11.74h0l1.37.26,1.25,1.25c.67,1.24,1.34,2.53,2,3.87h0l.75,1.01c-.34,2.74-.68,4.44-1.01,5.11h0c-.66,1.08-.66,1.96,0,2.62h0c.5.5.71.84.63,1.01-.09.16-.63.49-1.62.99h0c-.83.5-1.66,1-2.5,1.5h0c-.58.41-1.7.7-3.37.87h0c-11.82.49-29.13.82-51.93.99h0c-20.46.17-31.53.59-33.19,1.25h0c-1.91.5-4.08.5-6.5,0h0ZM398.81,93.07c.5-.33.83-.75.99-1.25.17-.49.34-1.65.51-3.49h0c.33-2.08.5-3.72.5-4.93s-.09-1.89-.26-2.06h0c-1.33-.33-2.87-.33-4.62,0h0l-.5.5c0,5.33.17,9.12.5,11.37h0c.83.33,1.79.29,2.87-.14h0ZM381.83,91.83l.51-.5c-.17-4.41-.34-7.2-.51-8.36h0v-.87h-1.25c-1.32.33-2.4.96-3.23,1.88h0c-.59,2.33-.89,4.78-.89,7.35h0l.26,1.25h4.62l.5-.75ZM419.02,91.33c.83-.16,1.5-.24,2-.24h0c.17,0,.26-.09.26-.26h0c0-.17.17-.42.5-.75h0c1.16-2.58,1.58-5.4,1.25-8.48h0c-.33-.33-1-.62-2-.87-.99-.25-2.12-.38-3.37-.38h-1.49l-.26.75c-.5,2.75-.92,5.83-1.25,9.23h0v1.49c2,0,3.45-.17,4.36-.5h0ZM383.95,69.37c3.42-.17,7.25-.34,11.49-.51h0c7.16-.33,13.02-.58,17.6-.74h1.37c-.91-1.08-1.7-2.13-2.36-3.13h0l-1.01-1.5c.5-5.99.67-9.9.5-11.73h0c-.33-.25-1.39-.42-3.17-.5-1.79-.08-3.81-.04-6.06.12h0c-2.33.25-4.11.46-5.35.63h0c-.83,0-1.17.09-1.01.26.17.16.96.33,2.38.5h0c1.49.33,2.7.62,3.61.87.92.25,1.51.54,1.76.87h0l.74.5c-.16,3.58-.33,5.87-.5,6.87h0c-.16.41-.24.87-.24,1.37h0c.16.83-.07,1.37-.69,1.62-.62.25-1.85.38-3.68.38h-9.73c-.33-.5-.75-1.87-1.25-4.12h0c-.58-2.34-.87-3.98-.87-4.93s.29-1.68.87-2.18h0c.66-1,.83-1.75.5-2.26h0c-.5,0-2.54.17-6.12.51h0l-1.37,3.99c-1.66,4.16-3.2,7.24-4.62,9.23h0c-1,.83-1.75,1.37-2.24,1.62h0c-.83.33-1,.67-.51,1.01h0c.17,0,.34.08.51.24h0c.33.67,1.18,1.05,2.56,1.13s3.68.04,6.92-.12h0ZM392.31,35.3v-3.74c0-2.09.09-3.5.26-4.24.17-.75.63-1.29,1.37-1.62h0c.5-.25.63-.38.38-.38-.25,0-.75.13-1.49.38h0c-1.17.33-2.59.75-4.26,1.25h0c-1.74.5-2.78.92-3.11,1.25s-.5,1.16-.5,2.5h0c0,1.24.17,2.78.5,4.62h6.86ZM410.3,34.54h1.99v-3.25c0-1.74-.13-3.03-.38-3.87-.25-.83-.79-1.41-1.61-1.74h0c-4.41-.25-8.86-.38-13.35-.38h0l-.51.26c2.59.74,4.88,1.28,6.87,1.61h0c1.41.17,2.33.51,2.74,1.01.42.5.63,1.46.63,2.87h0c-.17,1.66-.51,2.75-1.01,3.25h0c-.66.33-.91.54-.74.62.16.08.74.12,1.74.12h0c1.16-.16,2.37-.33,3.62-.5h0Z"/>
                    </g>
                    <g>
                      <path class="fill-current stroke-current" style="stroke-width: .06px; stroke-miterlimit: 6.02;" d="M15.94,195.13H.36l7.32-61.98h15.17l12.75,43.54,12.75-43.54h15.02l7.44,61.98h-15.61l-4.72-39.86,2.31.07-9.74,39.78h-15.17l-9.85-39.78,2.6-.07-4.68,39.86Z"/>
                      <path class="fill-current stroke-current" style="stroke-width: .06px; stroke-miterlimit: 6.02;" d="M100.86,195.54h0c-4.02,0-7.4-.41-10.15-1.23-2.75-.84-4.96-2.18-6.62-4.02-1.66-1.83-2.86-4.21-3.61-7.14-.72-2.92-1.08-6.47-1.08-10.63h0c0-4.51.38-8.25,1.15-11.23.74-2.97,1.95-5.33,3.61-7.06,1.66-1.76,3.87-3,6.62-3.72,2.75-.72,6.11-1.08,10.08-1.08h0c3.99,0,7.36.38,10.11,1.15,2.75.79,4.94,2.06,6.58,3.79,1.66,1.76,2.86,4.13,3.61,7.1.74,2.97,1.12,6.65,1.12,11.04h0c0,4.34-.35,7.98-1.04,10.93-.69,2.95-1.86,5.32-3.49,7.1-1.64,1.76-3.83,3.04-6.58,3.83-2.75.77-6.18,1.15-10.3,1.15ZM100.86,182.71h0c1.04,0,1.9-.1,2.57-.3s1.2-.63,1.6-1.3c.4-.67.67-1.7.82-3.09.17-1.39.26-3.25.26-5.58h0c0-2.33-.09-4.18-.26-5.54-.15-1.36-.42-2.38-.82-3.05-.4-.67-.93-1.1-1.6-1.3s-1.52-.3-2.57-.3h0c-1.07,0-1.93.1-2.6.3-.67.2-1.19.63-1.56,1.3-.4.67-.68,1.69-.86,3.05s-.26,3.21-.26,5.54h0c0,2.33.09,4.19.26,5.58.17,1.39.46,2.42.86,3.09.37.67.89,1.1,1.56,1.3.67.2,1.54.3,2.6.3Z"/>
                      <path class="fill-current stroke-current" style="stroke-width: .06px; stroke-miterlimit: 6.02;" d="M160.34,195.13h-18.7l-13.83-44.95h16.69l6.8,30.04,7.18-30.04h16.51l-14.65,44.95Z"/>
                      <path class="fill-current stroke-current" style="stroke-width: .06px; stroke-miterlimit: 6.02;" d="M197.88,144.49h-12.68c-1.34,0-2.01-.63-2.01-1.9h0v-9.26c0-1.39.67-2.08,2.01-2.08h12.68c.62,0,1.08.2,1.38.59.3.37.45.87.45,1.49h0v9.26c0,1.26-.61,1.9-1.82,1.9h0ZM199.55,195.13h-16.17v-44.95h16.17v44.95Z"/>
                      <path class="fill-current stroke-current" style="stroke-width: .06px; stroke-miterlimit: 6.02;" d="M233,195.61h0c-3.49,0-6.63-.41-9.41-1.23-2.8-.84-5.19-2.38-7.18-4.61-2.01-2.21-3.54-5.39-4.61-9.55-1.04-4.19-1.56-9.62-1.56-16.28h0c0-6.44.56-11.72,1.67-15.84,1.09-4.11,2.65-7.3,4.68-9.55,2.03-2.26,4.44-3.8,7.21-4.65,2.8-.87,5.86-1.3,9.18-1.3h0c3.45,0,6.49.17,9.15.52,2.63.37,4.87.81,6.73,1.3,1.88.5,3.37.99,4.46,1.49h0v12.6c-1.04-.22-2.4-.45-4.09-.67-1.66-.22-3.56-.4-5.69-.52-2.16-.15-4.47-.22-6.95-.22h0c-1.91,0-3.51.2-4.8.59-1.31.37-2.37,1.15-3.16,2.34-.77,1.16-1.34,2.86-1.71,5.09-.35,2.26-.52,5.25-.52,9h0c0,3.32.14,6.1.41,8.33.27,2.23.77,3.97,1.49,5.2.74,1.26,1.8,2.16,3.16,2.68,1.36.52,3.12.78,5.28.78h0c4.21,0,7.65-.06,10.3-.19,2.65-.15,4.75-.33,6.28-.56h0v12.6c-1.39.55-3.01,1.02-4.87,1.41s-4.04.69-6.54.89c-2.5.22-5.48.33-8.92.33Z"/>
                      <path class="fill-current stroke-current" style="stroke-width: .06px; stroke-miterlimit: 6.02;" d="M286.55,195.39h-6.92c-3.54,0-6.48-.56-8.81-1.67-2.31-1.12-4-2.78-5.09-4.98-1.12-2.18-1.67-4.92-1.67-8.22h0v-49h16.17v46.51c0,1.07.12,1.96.37,2.68.25.72.63,1.28,1.15,1.67.55.4,1.23.67,2.04.82h0l2.75.41v11.79Z"/>
                      <path class="fill-current stroke-current" style="stroke-width: .06px; stroke-miterlimit: 6.02;" d="M315.53,195.54h0c-4.02,0-7.4-.41-10.15-1.23-2.75-.84-4.96-2.18-6.62-4.02-1.66-1.83-2.86-4.21-3.61-7.14-.72-2.92-1.08-6.47-1.08-10.63h0c0-4.51.38-8.25,1.15-11.23.74-2.97,1.95-5.33,3.61-7.06,1.66-1.76,3.87-3,6.62-3.72,2.75-.72,6.11-1.08,10.08-1.08h0c3.99,0,7.36.38,10.11,1.15,2.75.79,4.94,2.06,6.58,3.79,1.66,1.76,2.86,4.13,3.61,7.1.74,2.97,1.12,6.65,1.12,11.04h0c0,4.34-.35,7.98-1.04,10.93-.69,2.95-1.86,5.32-3.49,7.1-1.64,1.76-3.83,3.04-6.58,3.83-2.75.77-6.18,1.15-10.3,1.15ZM315.53,182.71h0c1.04,0,1.9-.1,2.57-.3s1.2-.63,1.6-1.3c.4-.67.67-1.7.82-3.09.17-1.39.26-3.25.26-5.58h0c0-2.33-.09-4.18-.26-5.54-.15-1.36-.42-2.38-.82-3.05-.4-.67-.93-1.1-1.6-1.3s-1.52-.3-2.57-.3h0c-1.07,0-1.93.1-2.6.3-.67.2-1.19.63-1.56,1.3-.4.67-.68,1.69-.86,3.05s-.26,3.21-.26,5.54h0c0,2.33.09,4.19.26,5.58.17,1.39.46,2.42.86,3.09.37.67.89,1.1,1.56,1.3.67.2,1.54.3,2.6.3Z"/>
                      <path class="fill-current stroke-current" style="stroke-width: .06px; stroke-miterlimit: 6.02;" d="M359.5,195.61h0c-3.89,0-6.95-1.23-9.18-3.68-2.23-2.48-3.35-5.75-3.35-9.82h0v-31.94h16.17v26.84c0,1.73.42,2.89,1.26,3.46.84.59,1.9.89,3.16.89h0c.84,0,1.92-.25,3.23-.74,1.29-.5,2.24-1.12,2.86-1.86h0v-28.59h16.17v44.95h-13.5l-2.68-4.35c-1.88,1.24-4.04,2.35-6.47,3.35-2.4.99-4.97,1.49-7.7,1.49Z"/>
                      <path class="fill-current stroke-current" style="stroke-width: .06px; stroke-miterlimit: 6.02;" d="M416.05,195.61h0c-3.4,0-6.28-.71-8.66-2.12-2.4-1.41-4.23-3.76-5.47-7.03-1.26-3.3-1.9-7.72-1.9-13.27h0c0-5.55.5-10.06,1.49-13.53.97-3.49,2.66-6.07,5.09-7.73,2.45-1.66,5.87-2.49,10.26-2.49h0c1.78,0,3.56.16,5.32.48,1.73.35,3.31.77,4.72,1.26h0v-19.67h16.17v63.61h-13.68l-2.49-4.09c-1.07.94-2.18,1.76-3.35,2.45-1.16.69-2.37,1.23-3.61,1.6-1.21.35-2.52.52-3.9.52ZM421.96,182.71h0c1.12,0,2.11-.19,2.97-.56.87-.35,1.52-.72,1.97-1.12h0v-18.18c-.52-.27-1.2-.58-2.04-.93-.87-.32-1.7-.48-2.49-.48h0c-1.49,0-2.69.25-3.61.74-.92.5-1.57,1.52-1.97,3.09-.4,1.56-.59,3.93-.59,7.1h0c0,3.05.19,5.3.56,6.77.37,1.49.98,2.45,1.82,2.9.87.45,2,.67,3.38.67Z"/>
                    </g>
                  </g>
                </svg>
              </div>
              <p class="text-base text-surface-600 dark:text-surface-400 text-center max-w-2xl">{{ t('about_movicloud_description') }}</p>
            </div>
            
            <!-- 版本信息 -->
            <div class="bg-surface-50 dark:bg-surface-700 rounded-lg p-4">
              <div class="flex items-center justify-between mb-3">
                <h4 class="font-medium text-surface-900 dark:text-surface-0 flex items-center gap-2">
                  <i class="pi pi-info-circle text-primary-500"></i>
                  {{ t('version_info') }}
                </h4>
                <button
                  v-if="!versionLoading"
                  @click="fetchVersionInfo"
                  class="text-primary-500 hover:text-primary-600 text-sm"
                  :title="t('check_for_updates')"
                >
                  <i class="pi pi-refresh"></i>
                </button>
                <i v-else class="pi pi-spin pi-spinner text-primary-500"></i>
              </div>
              <div class="space-y-2 text-sm">
                <div class="flex justify-between">
                  <span class="text-surface-600 dark:text-surface-400 flex items-center gap-2">
                    <i class="pi pi-tag text-surface-400"></i>
                    {{ t('app_version') }}
                  </span>
                  <span class="text-surface-900 dark:text-surface-0 font-medium">{{ versionInfo.currentVersion }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-surface-600 dark:text-surface-400 flex items-center gap-2">
                    <i class="pi pi-download text-surface-400"></i>
                    {{ t('latest_version') }}
                  </span>
                  <div class="flex items-center gap-2">
                    <span class="text-surface-900 dark:text-surface-0 font-medium">{{ versionInfo.latestVersion }}</span>
                    <span
                      v-if="versionInfo.updateAvailable"
                      class="px-2 py-0.5 bg-green-500 text-white text-xs rounded-full"
                    >
                      {{ t('update_available') }}
                    </span>
                    <span
                      v-else-if="versionInfo.currentVersion === versionInfo.latestVersion"
                      class="px-2 py-0.5 bg-blue-500 text-white text-xs rounded-full"
                    >
                      {{ t('latest') }}
                    </span>
                  </div>
                </div>
                <div v-if="versionInfo.updateAvailable && versionInfo.latestRelease" class="mt-3 pt-3 border-t border-surface-200 dark:border-surface-600">
                  <a
                    :href="versionInfo.latestRelease.html_url"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="inline-flex items-center gap-2 text-primary-500 hover:text-primary-600 text-sm font-medium"
                  >
                    <i class="pi pi-external-link"></i>
                    {{ t('view_release_notes') }}
                  </a>
                </div>
                <div class="flex justify-between mt-2">
                  <span class="text-surface-600 dark:text-surface-400 flex items-center gap-2">
                    <i class="pi pi-calendar text-surface-400"></i>
                    {{ t('build_date') }}
                  </span>
                  <span class="text-surface-900 dark:text-surface-0 font-medium">{{ new Date().toLocaleDateString() }}</span>
                </div>
              </div>
            </div>
            
            <!-- 联系方式 -->
            <div class="bg-surface-50 dark:bg-surface-700 rounded-lg p-4">
              <h4 class="font-medium text-surface-900 dark:text-surface-0 mb-3 flex items-center gap-2">
                <i class="pi pi-send text-primary-500"></i>
                {{ t('contact_us') }}
              </h4>
              <div class="space-y-3">
                <a
                  href="https://www.movicloud.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="flex items-center justify-between p-3 bg-surface-100 dark:bg-surface-600 rounded-lg hover:bg-surface-200 dark:hover:bg-surface-500 transition-colors group"
                >
                  <div class="flex items-center gap-3">
                    <i class="pi pi-globe text-primary-500 text-lg"></i>
                    <div class="flex flex-col">
                      <span class="text-surface-900 dark:text-surface-0 font-medium">{{ t('official_website') }}</span>
                      <span class="text-xs text-surface-500 dark:text-surface-400">https://www.movicloud.com</span>
                    </div>
                  </div>
                  <i class="pi pi-external-link text-surface-400 group-hover:text-primary-500"></i>
                </a>
                <a
                  href="https://t.me/movicloud_group"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="flex items-center justify-between p-3 bg-surface-100 dark:bg-surface-600 rounded-lg hover:bg-surface-200 dark:hover:bg-surface-500 transition-colors group"
                >
                  <div class="flex items-center gap-3">
                    <i class="pi pi-telegram text-blue-500 text-lg"></i>
                    <div class="flex flex-col">
                      <span class="text-surface-900 dark:text-surface-0 font-medium">{{ t('telegram_group') }}</span>
                      <span class="text-xs text-surface-500 dark:text-surface-400">@movicloud_group</span>
                    </div>
                  </div>
                  <i class="pi pi-external-link text-surface-400 group-hover:text-primary-500"></i>
                </a>
                <a
                  href="https://t.me/movicloud_channel"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="flex items-center justify-between p-3 bg-surface-100 dark:bg-surface-600 rounded-lg hover:bg-surface-200 dark:hover:bg-surface-500 transition-colors group"
                >
                  <div class="flex items-center gap-3">
                    <i class="pi pi-bell text-primary-500 text-lg"></i>
                    <div class="flex flex-col">
                      <span class="text-surface-900 dark:text-surface-0 font-medium">{{ t('telegram_channel') }}</span>
                      <span class="text-xs text-surface-500 dark:text-surface-400">@movicloud_channel</span>
                    </div>
                  </div>
                  <i class="pi pi-external-link text-surface-400 group-hover:text-primary-500"></i>
                </a>
              </div>
            </div>
            
            <!-- 版权信息 -->
            <div class="text-center text-sm text-surface-500 dark:text-surface-400 pt-4">
              <p>© 2026 MoviCloud. {{ t('all_rights_reserved') }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 账号管理弹窗 -->
    <Dialog
      v-model:visible="accountDialogVisible"
      :header="accountDialogMode === 'add' ? '添加账号' : '编辑账号'"
      :style="{ width: '500px' }"
      :breakpoints="{ '960px': '75vw', '640px': '90vw' }"
    >
      <div class="space-y-5">
        <div>
          <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
            账号名称
          </label>
          <InputText
            v-model="currentEditingAccount.account.name"
            type="text"
            placeholder="请输入账号名称"
            class="w-full"
            autocomplete="off"
          />
        </div>
        
        <!-- 迅雷网盘特殊字段 -->
        <template v-if="currentEditingAccount.type === 'xunlei'">
          <div>
            <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
              刷新Token
            </label>
            <InputText
              v-model="currentEditingAccount.account.refreshToken"
              type="text"
              placeholder="请输入刷新Token"
              class="w-full"
              autocomplete="off"
            />
          </div>
          
          <div>
            <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
              用户ID
            </label>
            <InputText
              v-model="currentEditingAccount.account.captchaUserId"
              type="text"
              placeholder="请输入用户ID"
              class="w-full"
              autocomplete="off"
            />
          </div>
        </template>
        
        <!-- 其他网盘的Cookie字段 -->
        <template v-else>
          <div>
            <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
              Cookie
            </label>
            <textarea
              v-model="currentEditingAccount.account.cookie"
              placeholder="请粘贴Cookie内容"
              class="w-full h-40 p-3 border border-surface-300 dark:border-surface-600 rounded-lg bg-surface-0 dark:bg-surface-800 text-surface-900 dark:text-surface-0 resize-none"
            ></textarea>
          </div>
        </template>
      </div>
      
      <template #footer>
        <div class="flex justify-end gap-3">
          <Button
            label="取消"
            variant="text"
            @click="accountDialogVisible = false"
          />
          <Button
            label="保存"
            @click="saveAccountFromDialog"
          />
        </div>
      </template>
    </Dialog>

  </div>
</template>