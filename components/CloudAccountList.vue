<script setup lang="ts">
import { computed } from 'vue'
import { t } from '../composables/useI18n'
import { useCloudDrives } from '../composables/useCloudDrives'
import type { CloudDriveAccount } from '../composables/useCloudFileManagement'

interface Props {
  accounts: CloudDriveAccount[]
  selectedAccount: CloudDriveAccount | null
}

interface Emits {
  (e: 'select', account: CloudDriveAccount): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const { getDriveByCode } = useCloudDrives()

const getAccountLogo = (driveCode: string) => {
  const drive = getDriveByCode(driveCode)
  return drive?.logo || ''
}

const getAccountName = (driveCode: string) => {
  const drive = getDriveByCode(driveCode)
  return drive?.name || driveCode
}

const handleSelect = (account: CloudDriveAccount) => {
  emit('select', account)
}
</script>

<template>
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    <div
      v-for="account in accounts"
      :key="account.id"
      @click="handleSelect(account)"
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
</template>
