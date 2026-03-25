<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { t } from '../composables/useI18n'
import { useConfirm } from 'primevue/useconfirm'
import { useCloudDrives } from '../composables/useCloudDrives'
import Menu from '../volt/Menu.vue'
import Dialog from '../volt/Dialog.vue'
import ConfirmDialog from '../volt/ConfirmDialog.vue'
import CloudFileTree from './CloudFileTree.vue'
import type { CloudFile, CloudDriveAccount } from '../composables/useCloudFileManagement'
import Button from '../volt/Button.vue'
import InputText from '../volt/InputText.vue'

interface Props {
  files: CloudFile[]
  loading: boolean
  currentPathName: string
  currentFid: string
  fidHistory: { fid: string; name: string }[]
  account: CloudDriveAccount
  userInfo?: {
    nickname?: string
    avatar?: string
  } | null
}

interface Emits {
  (e: 'navigate', file: CloudFile): void
  (e: 'back'): void
  (e: 'backToAccounts'): void
  (e: 'goToRoot'): void
  (e: 'refresh'): void
  (e: 'share', file: CloudFile): void
  (e: 'shareAndUpload', file: CloudFile): void
  (e: 'createFolder', folderName: string): void
  (e: 'rename', file: CloudFile, newName: string): void
  (e: 'delete', files: CloudFile[]): void
  (e: 'move', file: CloudFile, destFid: string): void
  (e: 'copy', file: CloudFile, destFid: string): void
  (e: 'search', query: string): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()
const confirm = useConfirm()
const { getDriveByCode } = useCloudDrives()

const selectedFiles = ref<CloudFile[]>([])
const searchQuery = ref('')
const menu = ref()
const currentMenuFile = ref<CloudFile | null>(null)
let searchTimeout: ReturnType<typeof setTimeout> | null = null

watch(searchQuery, (newValue) => {
  if (searchTimeout) {
    clearTimeout(searchTimeout)
  }
  
  searchTimeout = setTimeout(() => {
    if (newValue.trim()) {
      emit('search', newValue.trim())
    }
  }, 500)
})

const showCreateFolderDialog = ref(false)
const newFolderName = ref('')
const showRenameDialog = ref(false)
const renameTargetFile = ref<CloudFile | null>(null)
const renameNewName = ref('')
const showMoveDialog = ref(false)
const moveTargetFile = ref<CloudFile | null>(null)
const moveDestFid = ref('')
const selectedMoveFolder = ref('')
const showCopyDialog = ref(false)
const copyTargetFile = ref<CloudFile | null>(null)
const copyDestFid = ref('')
const selectedCopyFolder = ref('')

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const formatTime = (timestamp: number): string => {
  return new Date(timestamp * 1000).toLocaleString()
}

const getFileIcon = (file: CloudFile): string => {
  if (file.dir) return 'pi pi-folder'
  
  const ext = file.file_name.split('.').pop()?.toLowerCase()
  
  if (['mp4', 'mkv', 'avi', 'mov', 'wmv', 'flv', 'webm'].includes(ext || '')) {
    return 'pi pi-video'
  }
  if (['mp3', 'wav', 'flac', 'aac', 'ogg', 'wma'].includes(ext || '')) {
    return 'pi pi-volume-up'
  }
  if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'].includes(ext || '')) {
    return 'pi pi-image'
  }
  if (['pdf'].includes(ext || '')) {
    return 'pi pi-file-pdf'
  }
  if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext || '')) {
    return 'pi pi-folder'
  }
  
  return 'pi pi-file'
}

const getFileIconColor = (file: CloudFile): string => {
  if (file.dir) return 'text-yellow-500'
  
  const ext = file.file_name.split('.').pop()?.toLowerCase()
  
  if (['mp4', 'mkv', 'avi', 'mov', 'wmv', 'flv', 'webm'].includes(ext || '')) {
    return 'text-purple-500'
  }
  if (['mp3', 'wav', 'flac', 'aac', 'ogg', 'wma'].includes(ext || '')) {
    return 'text-green-500'
  }
  if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg'].includes(ext || '')) {
    return 'text-pink-500'
  }
  if (['pdf'].includes(ext || '')) {
    return 'text-red-500'
  }
  if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext || '')) {
    return 'text-orange-500'
  }
  
  return 'text-blue-500'
}

const canNavigateBack = computed(() => props.fidHistory.length > 0)

const handleFileClick = (file: CloudFile) => {
  if (file.dir) {
    emit('navigate', file)
  }
}

const handleBack = () => {
  if (canNavigateBack.value) {
    emit('back')
  } else {
    emit('backToAccounts')
  }
}

const handleRefresh = () => {
  emit('refresh')
}

const handleShare = (file: CloudFile) => {
  emit('share', file)
}

const handleShareAndUpload = (file: CloudFile) => {
  emit('shareAndUpload', file)
}

const handleSearchKeyup = (event: KeyboardEvent) => {
  if (event.key === 'Enter' && searchQuery.value.trim()) {
    emit('search', searchQuery.value.trim())
  }
}

const handleCreateFolder = () => {
  showCreateFolderDialog.value = true
  newFolderName.value = ''
}

const handleRename = (file: CloudFile) => {
  renameTargetFile.value = file
  renameNewName.value = file.file_name
  showRenameDialog.value = true
}

const confirmCreateFolder = () => {
  if (newFolderName.value.trim()) {
    emit('createFolder', newFolderName.value.trim())
    showCreateFolderDialog.value = false
  }
}

const confirmRename = () => {
  if (renameTargetFile.value && renameNewName.value.trim()) {
    confirm.require({
      message: t('confirm_rename_message', { oldName: renameTargetFile.value.file_name, newName: renameNewName.value.trim() }),
      header: t('confirm_rename'),
      icon: 'pi pi-exclamation-triangle',
      acceptProps: {
        label: t('confirm')
      },
      rejectProps: {
        label: t('cancel')
      },
      accept: () => {
        emit('rename', renameTargetFile.value!, renameNewName.value.trim())
        showRenameDialog.value = false
        confirm.close()
      }
    })
  }
}

const handleDelete = (files: CloudFile[]) => {
  confirm.require({
    message: t('confirm_delete_message'),
    header: t('confirm_delete'),
    icon: 'pi pi-exclamation-triangle',
    acceptProps: {
      label: t('confirm')
    },
    rejectProps: {
      label: t('cancel')
    },
    accept: () => {
      emit('delete', files)
      selectedFiles.value = []
      confirm.close()
    }
  })
}

const handleMove = (file: CloudFile) => {
  moveTargetFile.value = file
  moveDestFid.value = ''
  showMoveDialog.value = true
}

const handleCopy = (file: CloudFile) => {
  copyTargetFile.value = file
  copyDestFid.value = ''
  showCopyDialog.value = true
}

const confirmMove = () => {
  if (moveTargetFile.value && moveDestFid.value.trim()) {
    confirm.require({
      message: t('confirm_move_message', { fileName: moveTargetFile.value.file_name }),
      header: t('confirm_move'),
      icon: 'pi pi-exclamation-triangle',
      acceptProps: {
        label: t('confirm')
      },
      rejectProps: {
        label: t('cancel')
      },
      accept: () => {
        emit('move', moveTargetFile.value!, moveDestFid.value.trim())
        showMoveDialog.value = false
        confirm.close()
      }
    })
  }
}

const confirmCopy = () => {
  if (copyTargetFile.value && copyDestFid.value.trim()) {
    confirm.require({
      message: t('confirm_copy_message', { fileName: copyTargetFile.value.file_name }),
      header: t('confirm_copy'),
      icon: 'pi pi-exclamation-triangle',
      acceptProps: {
        label: t('confirm')
      },
      rejectProps: {
        label: t('cancel')
      },
      accept: () => {
        emit('copy', copyTargetFile.value!, copyDestFid.value.trim())
        showCopyDialog.value = false
        confirm.close()
      }
    })
  }
}

const toggleFileSelection = (file: CloudFile) => {
  const index = selectedFiles.value.findIndex(f => f.fid === file.fid)
  if (index > -1) {
    selectedFiles.value.splice(index, 1)
  } else {
    selectedFiles.value.push(file)
  }
}

const isFileSelected = (file: CloudFile) => {
  return selectedFiles.value.some(f => f.fid === file.fid)
}

const getFileMenuItems = (file: CloudFile) => {
  return [
    {
      label: t('rename_file'),
      icon: 'pi pi-pencil',
      command: () => handleRename(file)
    },
    {
      label: t('delete_file'),
      icon: 'pi pi-trash',
      command: () => handleDelete([file])
    },
    {
      label: t('move_file'),
      icon: 'pi pi-arrow-right',
      command: () => handleMove(file)
    },
    {
      label: t('copy_file'),
      icon: 'pi pi-copy',
      command: () => handleCopy(file)
    }
  ]
}

const toggleMenu = (event: Event, file: CloudFile) => {
  currentMenuFile.value = file
  menu.value.toggle(event)
}

const handleMoveFolderSelect = (fid: string, name: string) => {
  moveDestFid.value = fid
  selectedMoveFolder.value = name
}

const handleCopyFolderSelect = (fid: string, name: string) => {
  copyDestFid.value = fid
  selectedCopyFolder.value = name
}
</script>

<template>
  <div class="flex flex-col h-full">
    <!-- 工具栏 -->
    <div class="mb-6">
      <div class="bg-white dark:bg-surface-800 rounded-2xl shadow-lg border border-surface-100 dark:border-surface-700 p-4">
        <div class="flex items-center gap-3 mb-3">
          <button
            @click="handleBack"
            class="flex items-center gap-2 px-4 py-2.5 bg-surface-100 dark:bg-surface-700 text-surface-700 dark:text-surface-300 rounded-xl hover:bg-surface-200 dark:hover:bg-surface-600 transition-all duration-200"
          >
            <i class="pi pi-arrow-up text-lg"></i>
            <span class="font-medium">{{ canNavigateBack ? t('parent_folder') : t('back_to_accounts') }}</span>
          </button>
          
          <div class="flex-1 flex items-center gap-2 px-4 py-2.5 bg-surface-50 dark:bg-surface-900/50 rounded-xl cursor-pointer hover:bg-surface-100 dark:hover:bg-surface-900/70 transition-colors">
            <i class="pi pi-home text-surface-400 cursor-pointer hover:text-primary-500" @click="emit('goToRoot')"></i>
            <i class="pi pi-chevron-right text-surface-300 text-xs"></i>
            <span class="font-medium text-surface-700 dark:text-surface-300">{{ currentPathName || '根目录' }}</span>
          </div>
          
          <div class="flex items-center gap-2">
            <button
              @click="handleRefresh"
              class="w-10 h-10 rounded-lg flex items-center justify-center text-surface-400 hover:text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-all"
              :title="t('refresh')"
            >
              <i class="pi pi-refresh"></i>
            </button>
            <button
              @click="handleCreateFolder"
              class="w-10 h-10 rounded-lg flex items-center justify-center text-surface-400 hover:text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-all"
              :title="t('new_folder')"
            >
              <i class="pi pi-folder-plus"></i>
            </button>
          </div>
        </div>
        
        <div class="flex items-center gap-3">
          <div class="flex-1 relative">
            <i class="pi pi-search absolute left-3 top-1/2 -translate-y-1/2 text-surface-400"></i>
            <input
              v-model="searchQuery"
              type="text"
              placeholder="搜索文件..."
              class="w-full pl-10 pr-4 py-2.5 bg-surface-50 dark:bg-surface-900/50 border border-surface-200 dark:border-surface-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-surface-900 dark:text-surface-0"
              @keyup="handleSearchKeyup"
            />
          </div>
          
          <!-- 用户信息 -->
          <div v-if="userInfo" class="flex items-center gap-3 px-4 py-2.5 bg-gradient-to-r from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-800/10 rounded-xl">
            <div class="w-8 h-8 rounded-full bg-primary-200 dark:bg-primary-800 flex items-center justify-center overflow-hidden">
              <img
                v-if="userInfo.avatar"
                :src="userInfo.avatar"
                :alt="userInfo.nickname"
                class="w-full h-full object-cover"
              />
              <i v-else class="pi pi-user text-primary-600 dark:text-primary-400 text-sm"></i>
            </div>
            <div class="flex-1">
              <div class="font-semibold text-sm text-surface-900 dark:text-surface-0">{{ userInfo.nickname || t('cloud_user') }}</div>
              <div class="text-xs text-surface-600 dark:text-surface-400">{{ getDriveByCode(account.driveCode)?.name || account.driveCode }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 文件列表 -->
    <div v-if="loading" class="flex flex-col items-center justify-center py-24">
      <div class="w-16 h-16 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center mb-4">
        <i class="pi pi-spin pi-spinner text-3xl text-primary-500"></i>
      </div>
      <span class="text-lg font-medium text-surface-600 dark:text-surface-400">{{ t('loading_files') }}</span>
    </div>
    
    <div v-else-if="files.length === 0" class="bg-white dark:bg-surface-800 rounded-2xl shadow-lg border border-surface-100 dark:border-surface-700 overflow-hidden">
      <div class="text-center py-24">
        <div class="w-24 h-24 rounded-full bg-surface-100 dark:bg-surface-700 flex items-center justify-center mx-auto mb-6">
          <i class="pi pi-folder-open text-5xl text-surface-400"></i>
        </div>
        <h3 class="text-xl font-semibold text-surface-700 dark:text-surface-300 mb-2">{{ t('no_files_in_folder') }}</h3>
        <p class="text-surface-500 dark:text-surface-400">该文件夹目前是空的</p>
      </div>
    </div>
    
    <div v-else class="bg-white dark:bg-surface-800 rounded-2xl shadow-lg border border-surface-100 dark:border-surface-700 overflow-hidden">
      <div
        v-for="file in files"
        :key="file.fid"
        @click="file.dir && handleFileClick(file)"
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
            @click.stop="handleShare(file)"
            class="w-9 h-9 rounded-lg flex items-center justify-center text-surface-400 hover:text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-all"
            :title="t('share_file')"
          >
            <i class="pi pi-share-alt"></i>
          </button>
          <button
            @click.stop="handleShareAndUpload(file)"
            class="w-9 h-9 rounded-lg flex items-center justify-center text-surface-400 hover:text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-all"
            :title="t('share_and_upload')"
          >
            <i class="pi pi-upload"></i>
          </button>
          <button
            @click.stop="toggleMenu($event, file)"
            class="w-9 h-9 rounded-lg flex items-center justify-center text-surface-400 hover:text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-all"
            :title="t('more_options')"
          >
            <i class="pi pi-ellipsis-v"></i>
          </button>
        </div>
      </div>
    </div>
    
    <Menu ref="menu" :model="currentMenuFile ? getFileMenuItems(currentMenuFile) : []" :popup="true" class="!min-w-[200px]" />
    
    <!-- 创建文件夹对话框 -->
    <Dialog
      v-model:visible="showCreateFolderDialog"
      :header="t('create_folder')"
      modal
      class="md:w-[400px] w-9/10"
      pt:mask="backdrop-blur-sm"
    >
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {{ t('folder_name') }}
          </label>
          <InputText
            v-model="newFolderName"
            :placeholder="t('enter_folder_name')"
            class="w-full"
            @keyup.enter="confirmCreateFolder"
          />
        </div>
      </div>
      <template #footer>
        <div class="flex gap-2">
          <Button
            :label="t('cancel')"
            severity="secondary"
            @click="showCreateFolderDialog = false"
          />
          <Button
            :label="t('confirm')"
            @click="confirmCreateFolder"
          />
        </div>
      </template>
    </Dialog>
    
    <!-- 重命名对话框 -->
    <Dialog
      v-model:visible="showRenameDialog"
      :header="t('rename_file')"
      modal
      class="md:w-[400px] w-9/10"
      pt:mask="backdrop-blur-sm"
    >
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {{ t('new_name') }}
          </label>
          <InputText
            v-model="renameNewName"
            :placeholder="t('enter_new_name')"
            class="w-full"
            @keyup.enter="confirmRename"
          />
        </div>
      </div>
      <template #footer>
        <div class="flex gap-2">
          <Button
            :label="t('cancel')"
            severity="secondary"
            @click="showRenameDialog = false"
          />
          <Button
            :label="t('confirm')"
            @click="confirmRename"
          />
        </div>
      </template>
    </Dialog>
    
    <!-- 移动对话框 -->
    <Dialog
      v-model:visible="showMoveDialog"
      :header="t('move_file')"
      modal
      class="md:w-[800px] w-9/10"
      pt:mask="backdrop-blur-sm"
    >
      <div class="space-y-4">
        <div v-if="moveTargetFile" class="p-3 bg-surface-100 dark:bg-surface-700 rounded-lg">
          <div class="flex items-center gap-3">
            <i :class="[moveTargetFile.dir ? 'pi pi-folder text-yellow-500' : 'pi pi-file text-blue-500', 'text-2xl']"></i>
            <div class="flex-1">
              <div class="font-medium text-surface-900 dark:text-surface-0">{{ moveTargetFile.file_name }}</div>
              <div class="text-sm text-surface-600 dark:text-surface-400">
                {{ moveTargetFile.dir ? t('folder') : t('file') }}
              </div>
            </div>
          </div>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {{ t('select_destination_folder') }}
          </label>
          <div class="h-[400px] border border-surface-200 dark:border-surface-600 rounded-lg overflow-auto">
            <CloudFileTree
              :account="account"
              :currentFid="currentFid"
              :excludeFid="moveTargetFile?.dir ? moveTargetFile.fid : undefined"
              @select="handleMoveFolderSelect"
            />
          </div>
          <div v-if="selectedMoveFolder" class="mt-2 p-2 bg-surface-100 dark:bg-surface-700 rounded-lg">
            <div class="text-sm font-medium">
              {{ t('selected_folder') }}: {{ selectedMoveFolder }}
            </div>
          </div>
        </div>
      </div>
      <template #footer>
        <div class="flex gap-2">
          <Button
            :label="t('cancel')"
            severity="secondary"
            @click="showMoveDialog = false"
          />
          <Button
            :label="t('confirm')"
            :disabled="!moveDestFid"
            @click="confirmMove"
          />
        </div>
      </template>
    </Dialog>
    
    <!-- 复制对话框 -->
    <Dialog
      v-model:visible="showCopyDialog"
      :header="t('copy_file')"
      modal
      class="md:w-[800px] w-9/10"
      pt:mask="backdrop-blur-sm"
    >
      <div class="space-y-4">
        <div v-if="copyTargetFile" class="p-3 bg-surface-100 dark:bg-surface-700 rounded-lg">
          <div class="flex items-center gap-3">
            <i :class="[copyTargetFile.dir ? 'pi pi-folder text-yellow-500' : 'pi pi-file text-blue-500', 'text-2xl']"></i>
            <div class="flex-1">
              <div class="font-medium text-surface-900 dark:text-surface-0">{{ copyTargetFile.file_name }}</div>
              <div class="text-sm text-surface-600 dark:text-surface-400">
                {{ copyTargetFile.dir ? t('folder') : t('file') }}
              </div>
            </div>
          </div>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {{ t('select_destination_folder') }}
          </label>
          <div class="h-[400px] border border-surface-200 dark:border-surface-600 rounded-lg overflow-auto">
            <CloudFileTree
              :account="account"
              :currentFid="currentFid"
              @select="handleCopyFolderSelect"
            />
          </div>
          <div v-if="selectedCopyFolder" class="mt-2 p-2 bg-surface-100 dark:bg-surface-700 rounded-lg">
            <div class="text-sm font-medium">
              {{ t('selected_folder') }}: {{ selectedCopyFolder }}
            </div>
          </div>
        </div>
      </div>
      <template #footer>
        <div class="flex gap-2">
          <Button
            :label="t('cancel')"
            severity="secondary"
            @click="showCopyDialog = false"
          />
          <Button
            :label="t('confirm')"
            :disabled="!copyDestFid"
            @click="confirmCopy"
          />
        </div>
      </template>
    </Dialog>
    
    <!-- 确认对话框 -->
    <ConfirmDialog />
  </div>
</template>
