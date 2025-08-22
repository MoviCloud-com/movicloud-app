<script setup lang="ts">
import { ref } from 'vue'
import { t } from '../composables/useI18n'
import type { FileItem } from '../types';

// 模拟文件数据
const files = ref([
  { id: 1, name: t('movie_folder'), type: 'folder' as const, size: '125GB', modified: '2024-01-15' },
  { id: 2, name: t('tv_folder'), type: 'folder' as const, size: '89GB', modified: '2024-01-14' },
  { id: 3, name: '阿凡达2.mp4', type: 'video' as const, size: '4.2GB', modified: '2024-01-13' },
  { id: 4, name: '流浪地球2.mp4', type: 'video' as const, size: '3.8GB', modified: '2024-01-12' },
])

const getFileIcon = (type: FileItem['type']): string => {
  switch (type) {
    case 'folder': return 'pi pi-folder';
    case 'video': return 'pi pi-video';
    default: return 'pi pi-file';
  }
};

useHead({
  title: t('cloud_drive') + ' - MoviCloud',
  meta: [
    { name: 'description', content: t('cloud_drive') }
  ]
});
</script>
<template>
    <div class="p-6">
      <!-- 工具栏 -->
      <div class="flex items-center justify-between mb-6">
        <div class="flex space-x-3">
          <button class="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors">
            <i class="pi pi-upload mr-2"></i>{{ t('upload_file') }}
          </button>
          <button class="px-4 py-2 bg-surface-500 text-white rounded-lg hover:bg-surface-600 transition-colors">
            <i class="pi pi-folder-plus mr-2"></i>{{ t('new_folder') }}
          </button>
        </div>
        <div class="text-sm text-surface-600 dark:text-surface-400">
          {{ t('storage_used') }}: 2.5TB / 10TB
        </div>
      </div>
      
      <!-- 文件列表 -->
      <div class="bg-surface-200 dark:bg-surface-800 rounded-lg shadow-sm overflow-hidden">
        <div class="grid grid-cols-12 gap-4 p-4 border-b border-surface-300 dark:border-surface-600 font-medium text-surface-700 dark:text-surface-300">
          <div class="col-span-6">{{ t('name') }}</div>
          <div class="col-span-2">{{ t('size') }}</div>
          <div class="col-span-2">{{ t('modified_time') }}</div>
          <div class="col-span-2">{{ t('actions') }}</div>
        </div>
        
        <div v-for="file in files" :key="file.id" class="grid grid-cols-12 gap-4 p-4 border-b border-surface-200 dark:border-surface-600 hover:bg-surface-50 dark:hover:bg-surface-700 transition-colors">
          <div class="col-span-6 flex items-center gap-3">
            <i :class="[getFileIcon(file.type), 'text-lg', file.type === 'folder' ? 'text-yellow-500' : 'text-blue-500']"></i>
            <span class="text-surface-900 dark:text-surface-0">{{ file.name }}</span>
          </div>
          <div class="col-span-2 text-surface-600 dark:text-surface-400">{{ file.size }}</div>
          <div class="col-span-2 text-surface-600 dark:text-surface-400">{{ file.modified }}</div>
          <div class="col-span-2 flex gap-2">
            <button class="text-primary hover:text-primary-600">
              <i class="pi pi-download"></i>
            </button>
            <button class="text-red-500 hover:text-red-600">
              <i class="pi pi-trash"></i>
            </button>
          </div>
        </div>
      </div>
    </div>
  
</template>
