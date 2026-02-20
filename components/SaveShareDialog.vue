<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { t } from '../composables/useI18n'
import Dialog from '../volt/Dialog.vue'
import Button from '../volt/Button.vue'
import CloudFileTree from './CloudFileTree.vue'
import type { CloudDriveAccountInfo } from '../composables/useCloudDriveAccounts'
import type { CloudDriveAccount } from '../composables/useCloudFileManagement'
import { useCloudFileManagement } from '../composables/useCloudFileManagement'

interface Props {
  visible: boolean
  shareUrl: string
  driveCode: string
  accounts: CloudDriveAccountInfo[]
}

interface Emits {
  (e: 'update:visible', value: boolean): void
  (e: 'success'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const { getShareInfo, getShareStoken, getShareList, saveShareFile, loading } = useCloudFileManagement()

const selectedAccount = ref<CloudDriveAccountInfo | null>(null)
const selectedDestFid = ref('0')
const selectedFolderName = ref('')
const shareInfo = ref<any>(null)
const shareFiles = ref<any[]>([])
const stoken = ref('')
const saving = ref(false)
const error = ref('')
const step = ref(1)

const validAccounts = computed(() => 
  props.accounts.filter(acc => acc.isValid)
)

watch(() => props.visible, async (newVal) => {
  if (newVal) {
    resetForm()
    await loadShareInfo()
  }
})

const resetForm = () => {
  selectedAccount.value = null
  selectedDestFid.value = '0'
  selectedFolderName.value = ''
  shareInfo.value = null
  shareFiles.value = []
  stoken.value = ''
  saving.value = false
  error.value = ''
  step.value = 1
}

const loadShareInfo = async () => {
  try {
    error.value = ''
    console.log('Loading share info for URL:', props.shareUrl)
    const result = await getShareInfo(props.driveCode, props.shareUrl)
    console.log('Share info result:', result)
    
    if (result.success && result.data) {
      shareInfo.value = result.data
      console.log('Parsed share info:', shareInfo.value)
      step.value = 2
    } else {
      error.value = result.message || t('get_share_info_failed')
    }
  } catch (err) {
    error.value = t('get_share_info_failed')
    console.error('获取分享信息失败:', err)
  }
}

const handleAccountSelect = async (account: CloudDriveAccountInfo) => {
  selectedAccount.value = account
  console.log('Selected account:', account)
  console.log('Share info pwd_id:', shareInfo.value?.pwd_id)
  
  if (shareInfo.value?.pwd_id) {
    try {
      error.value = ''
      console.log('Getting stoken with passcode:', shareInfo.value.passcode)
      const result = await getShareStoken(
        { 
          id: account.driveCode,
          name: account.name,
          cookie: account.cookie,
          driveCode: account.driveCode
        } as CloudDriveAccount,
        shareInfo.value.pwd_id,
        shareInfo.value.passcode || ''
      )
      
      console.log('Stoken result:', result)
      
      if (result.success && result.data) {
        stoken.value = result.data.stoken
        console.log('Got stoken:', stoken.value)
        await loadShareFiles()
      } else {
        error.value = result.message || t('get_share_stoken_failed')
      }
    } catch (err) {
      error.value = t('get_share_stoken_failed')
      console.error('获取stoken失败:', err)
    }
  }
}

const loadShareFiles = async () => {
  if (!selectedAccount.value || !shareInfo.value?.pwd_id || !stoken.value) return
  
  try {
    error.value = ''
    console.log('Loading share files with:', {
      pwd_id: shareInfo.value.pwd_id,
      stoken: stoken.value,
      pdir_fid: '0'
    })
    
    const result = await getShareList(
      {
        id: selectedAccount.value.driveCode,
        name: selectedAccount.value.name,
        cookie: selectedAccount.value.cookie,
        driveCode: selectedAccount.value.driveCode
      } as CloudDriveAccount,
      shareInfo.value.pwd_id,
      stoken.value,
      '0'
    )
    
    console.log('Share list result:', result)
    
    if (result.success && result.data) {
      shareFiles.value = result.data.list || []
      console.log('Share files:', shareFiles.value)
      step.value = 3
    } else {
      error.value = result.message || t('get_share_list_failed')
    }
  } catch (err) {
    error.value = t('get_share_list_failed')
    console.error('获取分享文件列表失败:', err)
  }
}

const handleFolderSelect = (fid: string, name: string) => {
  selectedDestFid.value = fid
  selectedFolderName.value = name
}

const handleSave = async () => {
  if (!selectedAccount.value || !shareInfo.value?.pwd_id || !stoken.value) return
  
  try {
    saving.value = true
    error.value = ''
    
    const fidList = shareFiles.value.map(file => file.fid)
    const shareTokenList = shareFiles.value.map(file => file.share_token)
    
    const result = await saveShareFile(
      {
        id: selectedAccount.value.driveCode,
        name: selectedAccount.value.name,
        cookie: selectedAccount.value.cookie,
        driveCode: selectedAccount.value.driveCode
      } as CloudDriveAccount,
      shareInfo.value.pwd_id,
      stoken.value,
      fidList,
      shareTokenList,
      selectedDestFid.value,
      true
    )
    
    if (result.success) {
      emit('success')
      emit('update:visible', false)
    } else {
      error.value = result.message || t('save_share_file_failed')
    }
  } catch (err) {
    error.value = t('save_share_file_failed')
    console.error('转存文件失败:', err)
  } finally {
    saving.value = false
  }
}

const handleClose = () => {
  emit('update:visible', false)
}
</script>

<template>
  <Dialog
    :visible="visible"
    @update:visible="$emit('update:visible', $event)"
    :header="t('save_to_cloud_drive')"
    modal
    class="md:w-[600px] w-9/10"
    pt:mask="backdrop-blur-sm"
    @hide="resetForm"
  >
    <div class="space-y-6">
      <div v-if="error" class="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
        <div class="flex items-center gap-2">
          <i class="pi pi-exclamation-triangle text-red-500"></i>
          <span class="text-red-700 dark:text-red-300">{{ error }}</span>
        </div>
      </div>

      <div v-if="loading" class="flex items-center justify-center py-8">
        <i class="pi pi-spin pi-spinner text-primary-500 text-2xl"></i>
      </div>

      <div v-else-if="step === 1" class="text-center py-8">
        <i class="pi pi-spin pi-spinner text-primary-500 text-2xl"></i>
        <p class="mt-4 text-surface-600 dark:text-surface-400">{{ t('loading_share_info') }}</p>
      </div>

      <div v-else-if="step === 2" class="space-y-4">
        <div class="text-sm text-surface-600 dark:text-surface-400">
          {{ t('select_account_to_save') }}
        </div>
        
        <div class="grid grid-cols-1 gap-3">
          <button
            v-for="account in validAccounts"
            :key="account.cookie"
            @click="handleAccountSelect(account)"
            class="p-4 rounded-lg border-2 transition-all duration-200 text-left"
            :class="[
              selectedAccount?.cookie === account.cookie
                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                : 'border-surface-200 dark:border-surface-700 hover:border-primary-300 dark:hover:border-primary-700'
            ]"
          >
            <div class="flex items-center gap-3">
              <img
                :src="account.logo"
                :alt="account.name"
                class="w-8 h-8 rounded-lg"
              />
              <div>
                <div class="font-medium text-surface-900 dark:text-surface-100">
                  {{ account.name }}
                </div>
                <div v-if="account.nickname" class="text-sm text-surface-600 dark:text-surface-400">
                  {{ account.nickname }}
                </div>
              </div>
            </div>
          </button>
        </div>
      </div>

      <div v-else-if="step === 3" class="space-y-4">
        <div class="text-sm text-surface-600 dark:text-surface-400">
          {{ t('select_destination_folder') }}
        </div>
        
        <div class="h-[400px] border border-surface-200 dark:border-surface-600 rounded-lg overflow-auto">
          <CloudFileTree
            v-if="selectedAccount"
            :account="{
              id: selectedAccount.driveCode,
              name: selectedAccount.name,
              cookie: selectedAccount.cookie,
              driveCode: selectedAccount.driveCode
            }"
            currentFid="0"
            @select="handleFolderSelect"
          />
        </div>
        
        <div v-if="selectedFolderName" class="p-3 bg-surface-100 dark:bg-surface-700 rounded-lg">
          <div class="text-sm">
            <span class="text-surface-600 dark:text-surface-400">{{ t('selected_folder') }}:</span>
            <span class="ml-2 font-medium text-surface-900 dark:text-surface-100">{{ selectedFolderName }}</span>
          </div>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="flex gap-3">
        <Button
          :label="t('cancel')"
          severity="secondary"
          @click="handleClose"
          class="flex-1"
        />
        <Button
          v-if="step === 3"
          :label="t('save')"
          :loading="saving"
          :disabled="!selectedDestFid || saving"
          @click="handleSave"
          class="flex-1"
        />
      </div>
    </template>
  </Dialog>
</template>
