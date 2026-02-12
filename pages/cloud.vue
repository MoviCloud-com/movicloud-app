<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { t } from '../composables/useI18n'
import { useRouter } from 'vue-router'
import { useCloudDrives } from '../composables/useCloudDrives'
import { useToast } from 'primevue/usetoast'
import Dialog from '../volt/Dialog.vue'
import InputText from '../volt/InputText.vue'
import Button from '../volt/Button.vue'

const router = useRouter()
const { cloudDrives, getDriveByCode } = useCloudDrives()
const toast = useToast()

// 页面状态
type ViewMode = 'accounts' | 'files'
const viewMode = ref<ViewMode>('accounts')
const loading = ref(false)
const loadingFiles = ref(false)
const loadingSearch = ref(false)
const error = ref('')
const isSearchMode = ref(false)
const searchQuery = ref('')

// 分享相关
const shareDialogVisible = ref(false)
const sharingFile = ref<QuarkFile | null>(null)
const sharePasscode = ref('')
const shareExpireType = ref(1)
const creatingShare = ref(false)
const shareResult = ref<any>(null)

// 选中的账号
interface CloudDriveAccount {
  id: string
  name: string
  cookie: string
  driveCode: string
}

const selectedAccount = ref<CloudDriveAccount | null>(null)

// 网盘设置
interface CloudDriveSettings {
  quark: Array<{ id: string; name: string; cookie: string }>
  uc: Array<{ id: string; name: string; cookie: string }>
  cloud123: Array<{ id: string; name: string; cookie: string }>
  cloud115: Array<{ id: string; name: string; cookie: string }>
  xunlei: Array<{ id: string; name: string; cookie: string }>
}

const cloudDriveSettings = ref<CloudDriveSettings>({
  quark: [],
  uc: [],
  cloud123: [],
  cloud115: [],
  xunlei: []
})

// 文件列表
interface QuarkFile {
  fid: string
  file_name: string
  path: string
  size: number
  ctime: number
  mtime: number
  dir: boolean
  download_url?: string
}

const files = ref<QuarkFile[]>([])
const currentFid = ref('0')
const currentPathName = ref('')
const fidHistory = ref<{ fid: string; name: string }[]>([])

// 页面元数据
useHead({
  title: t('cloud_drive_title') + ' - MoviCloud',
  meta: [
    { name: 'description', content: t('cloud_drive_subtitle') }
  ]
})

// 获取所有配置的账号
const allAccounts = computed<CloudDriveAccount[]>(() => {
  const accounts: CloudDriveAccount[] = []
  
  cloudDriveSettings.value.quark.forEach(account => {
    accounts.push({
      ...account,
      driveCode: 'quark'
    })
  })
  
  cloudDriveSettings.value.uc.forEach(account => {
    accounts.push({
      ...account,
      driveCode: 'uc'
    })
  })
  
  return accounts
})

// 加载网盘设置
const loadCloudDriveSettings = async () => {
  try {
    loading.value = true
    const response = await $fetch('/api/settings/cloud-drive')
    if (response.success && response.data) {
      cloudDriveSettings.value = {
        quark: response.data.quark || [],
        uc: response.data.uc || [],
        cloud123: response.data.cloud123 || [],
        cloud115: response.data.cloud115 || [],
        xunlei: response.data.xunlei || []
      }
    }
  } catch (err) {
    error.value = '加载网盘设置失败'
  } finally {
    loading.value = false
  }
}

// 搜索文件
const searchFiles = async (query: string) => {
  if (!selectedAccount.value || !query.trim()) {
    if (!query.trim()) {
      isSearchMode.value = false
      loadFiles(currentFid.value)
    }
    return
  }
  
  try {
    loadingSearch.value = true
    error.value = ''
    isSearchMode.value = true
    
    const apiPath = selectedAccount.value.driveCode === 'uc'
      ? '/api/cloud-drive/uc/search'
      : '/api/cloud-drive/quark/search'
    
    const response = await $fetch(apiPath, {
      method: 'POST',
      body: {
        cookies: selectedAccount.value.cookie,
        query: query.trim()
      }
    })
    
    if (response.success && response.data && response.data.list) {
      files.value = response.data.list
    } else {
      error.value = response.message || t('load_files_failed')
    }
  } catch (err) {
    error.value = t('load_files_failed')
  } finally {
    loadingSearch.value = false
  }
}

// 防抖搜索
let searchDebounceTimer: ReturnType<typeof setTimeout> | null = null
const debouncedSearch = (query: string) => {
  if (searchDebounceTimer) {
    clearTimeout(searchDebounceTimer)
  }
  searchDebounceTimer = setTimeout(() => {
    searchFiles(query)
  }, 500)
}

// 回到根目录
const goToRoot = () => {
  currentFid.value = '0'
  currentPathName.value = ''
  fidHistory.value = []
  isSearchMode.value = false
  searchQuery.value = ''
  loadFiles('0')
}

// 进入账号
const enterAccount = (account: CloudDriveAccount) => {
  selectedAccount.value = account
  viewMode.value = 'files'
  currentFid.value = '0'
  currentPathName.value = ''
  fidHistory.value = []
  isSearchMode.value = false
  searchQuery.value = ''
  loadFiles('0')
}

// 返回账号列表
const backToAccounts = () => {
  viewMode.value = 'accounts'
  selectedAccount.value = null
  files.value = []
}

// 加载文件列表
const loadFiles = async (fid: string = '0') => {
  if (!selectedAccount.value) return
  
  try {
    loadingFiles.value = true
    error.value = ''
    
    const apiPath = selectedAccount.value.driveCode === 'uc' 
      ? '/api/cloud-drive/uc/list-files'
      : '/api/cloud-drive/quark/list-files'
    
    const response = await $fetch(apiPath, {
      method: 'POST',
      body: {
        cookies: selectedAccount.value.cookie,
        dirFid: fid
      }
    })
    
    if (response.success && response.data && response.data.list) {
      files.value = response.data.list
    } else {
      error.value = response.message || t('load_files_failed')
    }
  } catch (err) {
    error.value = t('load_files_failed')
  } finally {
    loadingFiles.value = false
  }
}

// 进入文件夹
const enterFolder = (file: QuarkFile) => {
  if (!file.dir) return
  
  // 如果是搜索模式，清除搜索状态
  if (isSearchMode.value) {
    isSearchMode.value = false
    searchQuery.value = ''
    fidHistory.value = []
  } else {
    fidHistory.value.push({ fid: currentFid.value, name: currentPathName.value })
  }
  
  currentFid.value = file.fid
  currentPathName.value = file.file_name
  loadFiles(file.fid)
}

// 返回上级目录
const goBack = () => {
  if (fidHistory.value.length > 0) {
    const previous = fidHistory.value.pop()
    if (previous) {
      currentFid.value = previous.fid
      currentPathName.value = previous.name
      loadFiles(previous.fid)
    }
  } else {
    currentFid.value = '0'
    currentPathName.value = ''
    loadFiles('0')
  }
}

// 格式化文件大小
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// 格式化时间
const formatTime = (timestamp: number): string => {
  const date = new Date(timestamp * 1000)
  return date.toLocaleString()
}

// 获取文件图标
const getFileIcon = (file: QuarkFile): string => {
  if (file.dir) return 'pi pi-folder'
  const ext = file.file_name.split('.').pop()?.toLowerCase()
  const videoExts = ['mp4', 'mkv', 'avi', 'mov', 'wmv', 'flv', 'webm']
  if (videoExts.includes(ext || '')) return 'pi pi-video'
  return 'pi pi-file'
}

// 获取文件图标颜色
const getFileIconColor = (file: QuarkFile): string => {
  if (file.dir) return 'text-yellow-500'
  const ext = file.file_name.split('.').pop()?.toLowerCase()
  const videoExts = ['mp4', 'mkv', 'avi', 'mov', 'wmv', 'flv', 'webm']
  if (videoExts.includes(ext || '')) return 'text-blue-500'
  return 'text-gray-500'
}

// 打开分享对话框
const openShareDialog = (file: QuarkFile) => {
  sharingFile.value = file
  sharePasscode.value = ''
  shareExpireType.value = 1
  shareResult.value = null
  shareDialogVisible.value = true
}

// 关闭分享对话框
const closeShareDialog = () => {
  shareDialogVisible.value = false
  sharingFile.value = null
  sharePasscode.value = ''
  shareExpireType.value = 1
  shareResult.value = null
}

// 创建分享
const createShare = async () => {
  if (!sharingFile.value || !selectedAccount.value) return

  try {
    creatingShare.value = true
    
    const apiPath = selectedAccount.value.driveCode === 'uc'
      ? '/api/cloud-drive/uc/create-share'
      : '/api/cloud-drive/quark/create-share'
    
    const response = await $fetch(apiPath, {
      method: 'POST',
      body: {
        cookies: selectedAccount.value.cookie,
        fidList: [sharingFile.value.fid],
        passcode: sharePasscode.value,
        expiredType: shareExpireType.value
      }
    })
    
    if (response.success) {
      shareResult.value = response.data
      toast.add({
        severity: 'success',
        summary: t('success'),
        detail: t('share_success'),
        life: 3000
      })
    } else {
      toast.add({
        severity: 'error',
        summary: t('error'),
        detail: response.message || t('share_failed'),
        life: 3000
      })
    }
  } catch (err) {
    toast.add({
      severity: 'error',
      summary: t('error'),
      detail: t('share_failed'),
      life: 3000
    })
  } finally {
    creatingShare.value = false
  }
}

// 复制分享链接
const copyShareLink = async () => {
  if (!shareResult.value) return
  
  let link = shareResult.value.share_url
  if (shareResult.value.passcode) {
    link += ` 提取码: ${shareResult.value.passcode}`
  }
  
  try {
    await navigator.clipboard.writeText(link)
    toast.add({
      severity: 'success',
      summary: t('success'),
      detail: t('share_link_copied'),
      life: 3000
    })
  } catch (err) {
    toast.add({
      severity: 'error',
      summary: t('error'),
      detail: '复制失败',
      life: 3000
    })
  }
}

// 页面加载时获取数据
onMounted(async () => {
  await loadCloudDriveSettings()
})
</script>

<template>
  <div class="bg-surface-50 dark:bg-surface-950 min-h-screen">
    <div class="relative h-48 bg-gradient-to-b from-primary-500 to-transparent">
      <div class="absolute inset-0"></div>
      <div class="relative h-full flex items-center justify-center">
        <div class="text-center text-white">
          <h1 class="text-5xl font-bold mb-4">{{ t('cloud_drive_title') }}</h1>
          <p class="text-xl opacity-90">{{ t('cloud_drive_subtitle') }}</p>
        </div>
      </div>
      <div class="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-b from-transparent to-surface-50 dark:to-surface-950"></div>
    </div>

    <div class="p-6">
      <div v-if="viewMode === 'accounts'" class="mb-6">
        <div class="relative z-10 bg-gradient-to-r from-primary-500 to-purple-600 rounded-xl mx-1 p-0.1 cursor-pointer banner-card">
          <div class="bg-white/70 dark:bg-white/30 p-4 rounded-2xl">
            <div class="flex items-center justify-between">
            <div>
              <h3 class="text-xl font-bold text-primary-600 dark:text-white mb-2">免费申请网盘会员和空间扩容</h3>
              <p class="text-primary-600/90 text-sm dark:text-white/90">获取更多存储空间，享受高速下载体验</p>
            </div>
            <button
              @click="router.push('/netdisk-applications')"
              class="flex items-center gap-2 px-6 py-3 bg-white text-primary-600 font-semibold rounded-xl hover:bg-gray-100 transition-all duration-300 shadow-lg"
            >
              <i class="pi pi-arrow-right"></i>
              <span>立即申请</span>
            </button>
          </div>
          </div>
        </div>
      </div>
      
      <div v-if="loading && viewMode === 'accounts'" class="flex flex-col items-center justify-center py-24">
        <div class="w-16 h-16 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center mb-4">
          <i class="pi pi-spin pi-spinner text-3xl text-primary-500"></i>
        </div>
        <span class="text-lg font-medium text-surface-600 dark:text-surface-400">加载中...</span>
      </div>

      <div v-if="error && viewMode === 'accounts'" class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-6 mb-6">
        <div class="flex items-center">
          <div class="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mr-4">
            <i class="pi pi-exclamation-circle text-red-500 text-xl"></i>
          </div>
          <span class="text-red-700 dark:text-red-300 font-medium">{{ error }}</span>
        </div>
      </div>

      <div v-if="viewMode === 'accounts' && !loading">
        <div v-if="allAccounts.length === 0" class="max-w-2xl mx-auto text-center py-24">
          <div class="w-32 h-32 rounded-full bg-gradient-to-br from-primary-100 to-primary-50 dark:from-primary-900/30 dark:to-primary-900/10 flex items-center justify-center mx-auto mb-8 shadow-lg">
            <i class="pi pi-cloud text-6xl text-primary-500"></i>
          </div>
          <h3 class="text-2xl font-bold text-surface-800 dark:text-surface-100 mb-3">{{ t('no_cloud_accounts') }}</h3>
          <p class="text-surface-500 dark:text-surface-400 mb-8 text-lg">请先在设置中配置您的网盘账号，开始管理您的云端文件</p>
          <button
            @click="router.push('/settings')"
            class="inline-flex items-center gap-3 px-8 py-4 bg-primary-500 text-white rounded-xl hover:bg-primary-600 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-200 shadow-lg"
          >
            <i class="pi pi-cog text-xl"></i>
            <span class="font-bold text-lg">{{ t('go_to_settings') }}</span>
          </button>
        </div>

        <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div
            v-for="account in allAccounts"
            :key="account.id"
            @click="enterAccount(account)"
            class="group relative bg-white dark:bg-surface-800 rounded-2xl shadow-md hover:shadow-xl cursor-pointer transition-all duration-400 hover:-translate-y-2 border-0 overflow-hidden"
          >
            <div class="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-primary-400 via-primary-500 to-primary-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            
            <div class="p-7">
              <div class="flex items-start mb-6">
                <div
                  v-if="getDriveByCode(account.driveCode)"
                  class="w-16 h-16 rounded-2xl bg-surface-50 dark:bg-surface-700/50 flex items-center justify-center mr-5 group-hover:scale-105 transition-transform duration-300"
                >
                  <img
                    v-if="getDriveByCode(account.driveCode)?.logo"
                    :src="getDriveByCode(account.driveCode)?.logo"
                    :alt="getDriveByCode(account.driveCode)?.name"
                    class="w-12 h-12 rounded-2xl"
                  />
                  <i v-else class="pi pi-cloud text-primary-500 text-4xl"></i>
                </div>
                <div class="flex-1 pt-1">
                  <h3 class="font-bold text-xl text-surface-900 dark:text-surface-0 mb-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">{{ account.name }}</h3>
                  <div class="inline-flex items-center px-4 py-1.5 bg-gradient-to-r from-primary-50 to-primary-100 dark:from-primary-900/30 dark:to-primary-800/20 rounded-full">
                    <span class="text-xs font-semibold text-primary-700 dark:text-primary-300">
                      {{ getDriveByCode(account.driveCode)?.name || account.driveCode }}
                    </span>
                  </div>
                </div>
              </div>
              
              <div class="flex items-center justify-between">
                <div class="flex items-center text-surface-600 dark:text-surface-400">
                  <i class="pi pi-folder-open mr-3 text-xl"></i>
                  <span class="font-medium">{{ t('file_list') }}</span>
                </div>
                <div class="w-12 h-12 rounded-2xl bg-gradient-to-r from-primary-500 to-primary-600 flex items-center justify-center group-hover:from-primary-600 group-hover:to-primary-700 group-hover:shadow-lg group-hover:scale-110 transition-all duration-300">
                  <i class="pi pi-arrow-right text-white text-xl group-hover:translate-x-1 transition-transform"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-if="viewMode === 'files' && selectedAccount">
        <div class="mb-6">
          <div class="bg-white dark:bg-surface-800 rounded-2xl shadow-lg border border-surface-100 dark:border-surface-700 p-4">
            <div class="flex items-center gap-3 mb-3">
              <button
                @click="backToAccounts"
                class="flex items-center gap-2 px-4 py-2.5 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 rounded-xl hover:bg-primary-100 dark:hover:bg-primary-900/30 transition-all duration-200"
              >
                <i class="pi pi-arrow-left text-lg"></i>
                <span class="font-medium">返回账号</span>
              </button>
              
              <button
                @click="goBack"
                :disabled="fidHistory.length === 0 || isSearchMode"
                class="flex items-center gap-2 px-4 py-2.5 bg-surface-100 dark:bg-surface-700 text-surface-700 dark:text-surface-300 rounded-xl hover:bg-surface-200 dark:hover:bg-surface-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200"
              >
                <i class="pi pi-arrow-up text-lg"></i>
                <span class="font-medium">{{ t('parent_folder') }}</span>
              </button>
              
              <div class="flex-1 flex items-center gap-2 px-4 py-2.5 bg-surface-50 dark:bg-surface-900/50 rounded-xl cursor-pointer hover:bg-surface-100 dark:hover:bg-surface-900/70 transition-colors" @click="goToRoot">
                <i class="pi pi-home text-surface-400"></i>
                <i class="pi pi-chevron-right text-surface-300 text-xs"></i>
                <span v-if="isSearchMode" class="font-medium text-primary-600 dark:text-primary-400">搜索结果</span>
                <span v-else class="font-medium text-surface-700 dark:text-surface-300">{{ currentPathName || '根目录' }}</span>
              </div>
              
              <div class="flex items-center gap-2">
                <div
                  v-if="getDriveByCode(selectedAccount.driveCode)"
                  class="w-10 h-10 rounded-lg flex items-center justify-center"
                >
                  <img
                    v-if="getDriveByCode(selectedAccount.driveCode)?.logo"
                    :src="getDriveByCode(selectedAccount.driveCode)?.logo"
                    :alt="getDriveByCode(selectedAccount.driveCode)?.name"
                    class="w-8 h-8 rounded-lg"
                  />
                  <i v-else class="pi pi-cloud text-primary-500 text-xl"></i>
                </div>
                <span class="font-semibold text-surface-700 dark:text-surface-300">{{ selectedAccount.name }}</span>
              </div>
            </div>
            
            <div class="flex items-center gap-3">
              <div class="flex-1 relative">
                <i class="pi pi-search absolute left-3 top-1/2 -translate-y-1/2 text-surface-400"></i>
                <input
                  v-model="searchQuery"
                  @input="debouncedSearch(searchQuery)"
                  @keyup.enter="searchFiles(searchQuery)"
                  type="text"
                  placeholder="搜索文件..."
                  class="w-full pl-10 pr-4 py-2.5 bg-surface-50 dark:bg-surface-900/50 border border-surface-200 dark:border-surface-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-surface-900 dark:text-surface-0"
                />
                <button
                  v-if="searchQuery"
                  @click="searchQuery = ''; searchFiles('')"
                  class="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400 hover:text-surface-600 dark:hover:text-surface-200"
                >
                  <i class="pi pi-times"></i>
                </button>
              </div>
              <button
                v-if="isSearchMode"
                @click="searchQuery = ''; searchFiles('')"
                class="px-4 py-2.5 bg-surface-100 dark:bg-surface-700 text-surface-700 dark:text-surface-300 rounded-xl hover:bg-surface-200 dark:hover:bg-surface-600 transition-all duration-200"
              >
                <i class="pi pi-times mr-2"></i>
                <span class="font-medium">取消搜索</span>
              </button>
            </div>
          </div>
        </div>

        <div v-if="loadingFiles || loadingSearch" class="flex flex-col items-center justify-center py-24">
          <div class="w-16 h-16 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center mb-4">
            <i class="pi pi-spin pi-spinner text-3xl text-primary-500"></i>
          </div>
          <span class="text-lg font-medium text-surface-600 dark:text-surface-400">{{ loadingSearch ? '搜索中...' : t('loading_files') }}</span>
        </div>

        <div v-else-if="error" class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-6 mb-6">
          <div class="flex items-center">
            <div class="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mr-4">
              <i class="pi pi-exclamation-circle text-red-500 text-xl"></i>
            </div>
            <span class="text-red-700 dark:text-red-300 font-medium">{{ error }}</span>
          </div>
        </div>

        <div v-else class="bg-white dark:bg-surface-800 rounded-2xl shadow-lg border border-surface-100 dark:border-surface-700 overflow-hidden">
          <div v-if="files.length === 0" class="text-center py-24">
            <div class="w-24 h-24 rounded-full bg-surface-100 dark:bg-surface-700 flex items-center justify-center mx-auto mb-6">
              <i class="pi pi-folder-open text-5xl text-surface-400"></i>
            </div>
            <h3 class="text-xl font-semibold text-surface-700 dark:text-surface-300 mb-2">{{ t('no_files_in_folder') }}</h3>
            <p class="text-surface-500 dark:text-surface-400">该文件夹目前是空的</p>
          </div>

          <template v-else>
            <div class="grid grid-cols-12 gap-4 px-6 py-4 border-b border-surface-100 dark:border-surface-700 bg-surface-50 dark:bg-surface-900/50">
              <div class="col-span-6 font-semibold text-surface-600 dark:text-surface-400 text-sm uppercase tracking-wider">{{ t('name') }}</div>
              <div class="col-span-2 font-semibold text-surface-600 dark:text-surface-400 text-sm uppercase tracking-wider">{{ t('size') }}</div>
              <div class="col-span-3 font-semibold text-surface-600 dark:text-surface-400 text-sm uppercase tracking-wider">{{ t('modified_time') }}</div>
              <div class="col-span-1 font-semibold text-surface-600 dark:text-surface-400 text-sm uppercase tracking-wider text-right">{{ t('actions') }}</div>
            </div>

            <div>
              <div
                v-for="file in files"
                :key="file.fid"
                @click="file.dir && enterFolder(file)"
                class="grid grid-cols-12 gap-4 px-6 py-4 border-b border-surface-50 dark:border-surface-700/50 hover:bg-surface-50 dark:hover:bg-surface-700/50 transition-all duration-200 group"
                :class="{ 'cursor-pointer': file.dir }"
              >
                <div class="col-span-6 flex items-center gap-4">
                  <div class="w-10 h-10 rounded-lg flex items-center justify-center" :class="file.dir ? 'bg-yellow-100 dark:bg-yellow-900/30' : 'bg-blue-100 dark:bg-blue-900/30'">
                    <i :class="[getFileIcon(file), 'text-xl', getFileIconColor(file)]"></i>
                  </div>
                  <span class="font-medium text-surface-800 dark:text-surface-100 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">{{ file.file_name }}</span>
                </div>
                <div class="col-span-2 flex items-center text-surface-600 dark:text-surface-400 font-medium">
                  {{ file.dir ? '-' : formatFileSize(file.size) }}
                </div>
                <div class="col-span-3 flex items-center text-surface-500 dark:text-surface-400 text-sm">
                  {{ formatTime(file.mtime) }}
                </div>
                <div class="col-span-1 flex items-center justify-end gap-1">
                <button
                  @click.stop="openShareDialog(file)"
                  class="w-9 h-9 rounded-lg flex items-center justify-center text-surface-400 hover:text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-all"
                  :title="t('share_file')"
                >
                  <i class="pi pi-share-alt"></i>
                </button>
                <button
                  v-if="!file.dir && file.download_url"
                  @click.stop="() => window.open(file.download_url, '_blank')"
                  class="w-9 h-9 rounded-lg flex items-center justify-center text-surface-400 hover:text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-all"
                  :title="t('download')"
                >
                  <i class="pi pi-download"></i>
                </button>
              </div>
              </div>
            </div>
          </template>
        </div>
      </div>
    </div>

    <!-- 分享对话框 -->
    <Dialog
      v-model:visible="shareDialogVisible"
      :header="t('share_title')"
      :modal="true"
      :style="{ width: '450px' }"
      :closable="true"
      @hide="closeShareDialog"
    >
      <div v-if="!shareResult" class="space-y-4">
        <p class="text-surface-600 dark:text-surface-400">{{ t('share_description') }}</p>
        
        <div>
          <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
            {{ t('name') }}
          </label>
          <div class="p-3 bg-surface-100 dark:bg-surface-700 rounded-lg text-surface-900 dark:text-surface-0">
            {{ sharingFile?.file_name }}
          </div>
        </div>
        
        <div>
          <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
            {{ t('share_passcode') }}
          </label>
          <InputText
            v-model="sharePasscode"
            type="text"
            :placeholder="t('share_passcode_placeholder')"
            class="w-full"
            maxlength="4"
          />
        </div>
        
        <div>
          <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
            {{ t('share_expire_type') }}
          </label>
          <select
            v-model="shareExpireType"
            class="w-full px-3 py-2 bg-surface-100 dark:bg-surface-700 border border-surface-300 dark:border-surface-600 rounded-lg text-surface-900 dark:text-surface-0"
          >
            <option :value="1">{{ t('share_forever') }}</option>
            <option :value="2">{{ t('share_1_day') }}</option>
            <option :value="3">{{ t('share_7_days') }}</option>
            <option :value="4">{{ t('share_30_days') }}</option>
          </select>
        </div>
      </div>
      
      <div v-else class="space-y-4">
        <div class="text-center py-4">
          <i class="pi pi-check-circle text-5xl text-green-500 mb-3"></i>
          <h3 class="text-xl font-semibold text-surface-900 dark:text-surface-0 mb-1">
            {{ t('share_success') }}
          </h3>
        </div>
        
        <div>
          <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
            {{ t('share_link') }}
          </label>
          <div class="p-3 bg-surface-100 dark:bg-surface-700 rounded-lg break-all text-surface-900 dark:text-surface-0">
            {{ shareResult.share_url }}
            <span v-if="shareResult.passcode" class="ml-2 text-primary-500 font-medium">
              提取码: {{ shareResult.passcode }}
            </span>
          </div>
        </div>
      </div>
      
      <template #footer>
        <div v-if="!shareResult" class="flex justify-end gap-2">
          <Button
            :label="t('cancel')"
            @click="closeShareDialog"
            variant="text"
          />
          <Button
            :label="t('create_share')"
            :loading="creatingShare"
            @click="createShare"
          />
        </div>
        <div v-else class="flex justify-end gap-2">
          <Button
            :label="t('close')"
            @click="closeShareDialog"
            variant="text"
          />
          <Button
            :label="t('copy_link')"
            @click="copyShareLink"
          >
            <template #icon>
              <i class="pi pi-copy mr-2"></i>
            </template>
          </Button>
        </div>
      </template>
    </Dialog>
  </div>
</template>

<style scoped>
.banner-card {
  position: relative;
}

.banner-card::before {
  content: '';
  position: absolute;
  inset: 0;
  left: -6px;
  top: -6px;
  right: -6px;
  bottom: -6px;
  margin: auto;
  border-radius: 1.5rem;
  background: linear-gradient(-45deg, #e81cff 0%, #40c9ff 100%);
  z-index: -10;
  pointer-events: none;
  transition: all 0.6s ease;
}

.banner-card::after {
  content: "";
  z-index: -1;
  position: absolute;
  inset: 0;
  background: linear-gradient(-45deg, #fc00ff 0%, #00dbde 100%);
  transform: translate3d(0, 0, 0) scale(0.95);
  filter: blur(20px);
  left: -6px;
  top: -6px;
  right: -6px;
  bottom: -6px;
  border-radius: 1.5rem;
  transition: all 0.6s ease;
}

.banner-card:hover::after {
  filter: blur(30px);
}
</style>
