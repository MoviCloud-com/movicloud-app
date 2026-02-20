<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { t } from '../composables/useI18n'
import { useRouter } from 'vue-router'
import { useCloudDrives } from '../composables/useCloudDrives'
import { useCloudFileManagement, type CloudDriveAccount, type CloudFile } from '../composables/useCloudFileManagement'

const router = useRouter()
const { getDriveByCode } = useCloudDrives()
const {
  loading,
  files,
  currentFid,
  currentPathName,
  fidHistory,
  loadFiles,
  navigateToFolder,
  navigateBack,
  createFolder,
  renameFile,
  deleteFiles,
  moveFile,
  copyFile,
  getUserInfo,
  searchFiles
} = useCloudFileManagement() 

type ViewMode = 'accounts' | 'files'
const viewMode = ref<ViewMode>('accounts') 
const error = ref('') 

const selectedAccount = ref<CloudDriveAccount | null>(null)
const userInfo = ref<{ nickname?: string; avatar?: string } | null>(null)
const sharingFile = ref<CloudFile | null>(null)
const shareDialogVisible = ref(false)
const shareAndUploadDialogVisible = ref(false)
 
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
 
useHead({
  title: t('cloud_drive_title') + ' - MoviCloud',
  meta: [
    { name: 'description', content: t('cloud_drive_subtitle') }
  ]
})
 
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
 
const loadCloudDriveSettings = async () => {
  try {
    loading.value = true
    const response = await $fetch<{
      success: boolean
      data?: {
        quark?: any[]
        uc?: any[]
        cloud123?: any[]
        cloud115?: any[]
        xunlei?: any[]
      }
      message?: string
    }>('/api/settings/cloud-drive')
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

const enterAccount = async (account: CloudDriveAccount) => {
  selectedAccount.value = account
  viewMode.value = 'files'
  
  // 获取用户信息
  const result = await getUserInfo(account)
  if (result.success && result.data) {
    userInfo.value = {
      nickname: result.data.nickname || result.data.name,
      avatar: result.data.avatarUri || result.data.avatar || result.data.headImg
    }
  }
  
  await loadFiles(account, '0')
}

const handleSelectAccount = (account: CloudDriveAccount) => {
  enterAccount(account)
}

const handleNavigate = (file: CloudFile) => {
  if (selectedAccount.value) {
    navigateToFolder(selectedAccount.value, file)
  }
}

const handleBack = () => {
  if (selectedAccount.value) {
    navigateBack(selectedAccount.value)
  }
}

const handleRefresh = () => {
  if (selectedAccount.value) {
    loadFiles(selectedAccount.value, currentFid.value)
  }
}

const handleShare = (file: CloudFile) => {
  sharingFile.value = file 
  shareDialogVisible.value = true
}

const handleShareAndUpload = (file: CloudFile) => {
  sharingFile.value = file
  shareAndUploadDialogVisible.value = true
}

const handleCreateFolder = async (folderName: string) => {
  if (selectedAccount.value) {
    await createFolder(selectedAccount.value, folderName, currentFid.value)
  }
}

const handleRename = async (file: CloudFile, newName: string) => {
  if (selectedAccount.value) {
    await renameFile(selectedAccount.value, file.fid, newName)
  }
}

const handleDelete = async (filesToDelete: CloudFile[]) => {
  if (selectedAccount.value) {
    await deleteFiles(selectedAccount.value, filesToDelete.map(f => f.fid))
  }
}

const handleMove = async (file: CloudFile, destFid: string) => {
  if (selectedAccount.value) {
    await moveFile(selectedAccount.value, file.fid, destFid)
  }
}

const handleCopy = async (file: CloudFile, destFid: string) => {
  if (selectedAccount.value) {
    await copyFile(selectedAccount.value, file.fid, destFid)
  }
}

const handleSearch = async (query: string) => {
  if (selectedAccount.value) {
    await searchFiles(selectedAccount.value, query)
  }
}

const handleGoToRoot = async () => {
  if (selectedAccount.value) {
    fidHistory.value = []
    currentPathName.value = ''
    await loadFiles(selectedAccount.value, '0')
  }
}

const goBackToAccounts = () => {
  viewMode.value = 'accounts'
  selectedAccount.value = null
  userInfo.value = null
  files.value = []
  currentFid.value = '0'
  currentPathName.value = ''
  fidHistory.value = []
}

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

        <CloudAccountList
          v-else
          :accounts="allAccounts"
          :selectedAccount="selectedAccount"
          @select="handleSelectAccount"
        />
      </div>

      <div v-if="viewMode === 'files' && selectedAccount">
        <CloudFileList
          :files="files"
          :loading="loading"
          :currentPathName="currentPathName"
          :currentFid="currentFid"
          :fidHistory="fidHistory"
          :account="selectedAccount"
          :userInfo="userInfo"
          @navigate="handleNavigate"
          @back="handleBack"
          @backToAccounts="goBackToAccounts"
          @refresh="handleRefresh"
          @share="handleShare"
          @shareAndUpload="handleShareAndUpload"
          @createFolder="handleCreateFolder"
          @rename="handleRename"
          @delete="handleDelete"
          @move="handleMove"
          @copy="handleCopy"
          @search="handleSearch"
          @goToRoot="handleGoToRoot"
        />
      </div>
    </div>

    <ShareDialog
      v-model:visible="shareDialogVisible"
      :file="sharingFile"
      :account="selectedAccount"
      @success="handleRefresh"
      v-if="selectedAccount"
    />

    <ShareAndUploadDialog
      v-model:visible="shareAndUploadDialogVisible"
      :file="sharingFile"
      :account="selectedAccount"
      @success="handleRefresh"
      v-if="selectedAccount"
    />
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