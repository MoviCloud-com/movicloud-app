<script setup lang="ts">
import { ref, watch } from 'vue'
import { t } from '../composables/useI18n'
import { useToast } from 'primevue/usetoast'
import Dialog from '../volt/Dialog.vue'
import Button from '../volt/Button.vue'
import InputText from '../volt/InputText.vue'
import SelectButton from '../volt/SelectButton.vue'
import type { CloudFile, CloudDriveAccount } from '../composables/useCloudFileManagement'
import { useCloudFileManagement } from '../composables/useCloudFileManagement'

interface Props {
  visible: boolean
  file: CloudFile | null
  account: CloudDriveAccount | null
}

interface Emits {
  (e: 'update:visible', value: boolean): void
  (e: 'success'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()
const toast = useToast()
const { createShare, loading } = useCloudFileManagement()

const passcode = ref('')
const expireType = ref(1)
const shareResult = ref<any>(null)
const creating = ref(false)

const expireOptions = [
  { label: t('permanent'), value: 1 },
  { label: t('1_day'), value: 2 },
  { label: t('7_days'), value: 3 },
  { label: t('30_days'), value: 4 }
]

watch(() => props.visible, (newVal) => {
  if (newVal) {
    passcode.value = ''
    expireType.value = 1
    shareResult.value = null
  }
})

const handleCreateShare = async () => {
  if (!props.file || !props.account) return
  
  try {
    creating.value = true
    
    const result = await createShare(
      props.account,
      props.file.fid,
      passcode.value,
      expireType.value
    )
    
    if (result.success && result.data) {
      shareResult.value = result.data
      toast.add({
        severity: 'success',
        summary: t('success'),
        detail: t('create_share_success'),
        life: 3000
      })
    } else {
      toast.add({
        severity: 'error',
        summary: t('error'),
        detail: result.message || t('create_share_failed'),
        life: 3000
      })
    }
  } catch (err) {
    toast.add({
      severity: 'error',
      summary: t('error'),
      detail: t('create_share_failed'),
      life: 3000
    })
  } finally {
    creating.value = false
  }
}

const copyShareLink = async () => {
  if (!shareResult.value) return
  
  const shareUrl = shareResult.value.share_url || shareResult.value.url
  const text = passcode.value
    ? `${shareUrl} 提取码: ${passcode.value}`
    : shareUrl
  
  try {
    await navigator.clipboard.writeText(text)
    toast.add({
      severity: 'success',
      summary: t('success'),
      detail: t('copy_success'),
      life: 3000
    })
  } catch (err) {
    toast.add({
      severity: 'error',
      summary: t('error'),
      detail: t('copy_failed'),
      life: 3000
    })
  }
}

const handleClose = () => {
  emit('update:visible', false)
  if (shareResult.value) {
    emit('success')
  }
}
</script>

<template>
  <Dialog
    :visible="visible"
    @update:visible="$emit('update:visible', $event)"
    :header="t('share_file')"
    modal
    class="md:w-[500px] w-9/10"
    pt:mask="backdrop-blur-sm"
    @hide="handleClose"
  >
    <div v-if="!shareResult" class="space-y-6">
      <!-- 文件信息 -->
      <div v-if="file" class="p-4 bg-surface-100 dark:bg-surface-700 rounded-lg">
        <div class="flex items-center gap-3">
          <i :class="[file.dir ? 'pi pi-folder text-yellow-500' : 'pi pi-file text-blue-500', 'text-2xl']"></i>
          <div class="flex-1">
            <div class="font-medium text-surface-900 dark:text-surface-0">{{ file.file_name }}</div>
            <div class="text-sm text-surface-600 dark:text-surface-400">
              {{ file.dir ? t('folder') : t('file') }}
            </div>
          </div>
        </div>
      </div>

      <!-- 提取码 -->
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          {{ t('passcode') }} ({{ t('optional') }})
        </label>
        <InputText
          v-model="passcode"
          :placeholder="t('enter_passcode')"
          class="w-full"
        />
      </div>

      <!-- 有效期 -->
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          {{ t('expire_time') }}
        </label>
        <SelectButton
          v-model="expireType"
          :options="expireOptions"
          optionLabel="label"
          optionValue="value"
          class="w-full"
        />
      </div>
    </div>

    <!-- 分享结果 -->
    <div v-else class="space-y-6">
      <div class="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
        <div class="flex items-center gap-2 mb-2">
          <i class="pi pi-check-circle text-green-500 text-xl"></i>
          <span class="font-semibold text-green-700 dark:text-green-400">{{ t('share_created') }}</span>
        </div>
        <div class="text-sm text-green-600 dark:text-green-300">
          {{ shareResult.share_url || shareResult.url }}
        </div>
        <div v-if="passcode" class="text-sm text-green-600 dark:text-green-300 mt-1">
          {{ t('passcode') }}: {{ passcode }}
        </div>
      </div>

      <Button
        :label="t('copy_share_link')"
        icon="pi pi-copy"
        @click="copyShareLink"
        class="w-full"
      />
    </div>

    <template #footer>
      <div class="flex gap-4">
        <button
          v-if="!shareResult"
          @click="handleCreateShare"
          :disabled="creating"
          class="flex-1 px-6 py-3 bg-primary-500 hover:bg-primary-600 disabled:bg-primary-300 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
        >
          <i class="pi pi-check text-lg"></i>
          {{ t('create_share') }}
        </button>
        <button
          v-if="!shareResult"
          @click="handleClose"
          class="px-6 py-3 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-lg transition-colors duration-200"
        >
          {{ t('cancel') }}
        </button>
        <button
          v-else
          @click="handleClose"
          class="flex-1 px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white font-semibold rounded-lg transition-colors duration-200"
        >
          {{ t('close') }}
        </button>
      </div>
    </template>
  </Dialog>
</template>
