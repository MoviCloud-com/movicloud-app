<template>
  <div class="bg-gray-200 dark:bg-surface-800 rounded-lg p-6 shadow-sm">
    <!-- 筛选选项一行显示 -->
    <div class="flex flex-wrap items-start gap-6">
      <!-- 资源类型 -->
      <div class="flex items-start gap-3">
        <span class="text-base font-medium text-surface-700 dark:text-surface-300 whitespace-nowrap mt-1 min-w-fit">{{ t('resource_type') }}</span>
        <div class="flex flex-wrap gap-2">
          <button
            v-for="type in resourceTypeOptions"
            :key="type.value"
            @click="toggleResourceType(type.value)"
            :class="[
              'px-3 py-1 rounded-lg text-sm font-medium transition-colors duration-200 cursor-pointer',
              selectedResourceTypes.includes(type.value)
                ? 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300'
                : 'bg-surface-100 text-surface-700 dark:bg-surface-700 dark:text-surface-300 hover:bg-surface-200 dark:hover:bg-surface-600'
            ]"
          >
            {{ type.label }}
          </button>
        </div>
      </div>

      <!-- 网盘选择 -->
      <div class="flex items-start gap-3">
        <span class="text-base font-medium text-surface-700 dark:text-surface-300 whitespace-nowrap mt-1 min-w-fit">{{ t('cloud_drive') }}</span>
        <div class="flex flex-wrap gap-2">
          <button
            v-for="drive in cloudDriveOptions"
            :key="drive.value"
            @click="toggleCloudDrive(drive.value)"
            :class="[
              'px-3 py-1 rounded-lg text-sm font-medium transition-colors duration-200 cursor-pointer flex items-center gap-2',
              selectedCloudDrives.includes(drive.value)
                ? 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300'
                : 'bg-surface-100 text-surface-700 dark:bg-surface-700 dark:text-surface-300 hover:bg-surface-200 dark:hover:bg-surface-600'
            ]"
          >
            <img 
              :src="drive.logo" 
              :alt="drive.label"
              class="w-4 h-4 rounded"
              @error="(event) => { const target = event.target as HTMLImageElement; target.src = '' }"
            />
            {{ drive.label }}
          </button>
        </div>
      </div>

      <!-- 分辨率 -->
      <div class="flex items-start gap-3">
        <span class="text-base font-medium text-surface-700 dark:text-surface-300 whitespace-nowrap mt-1 min-w-fit">{{ t('resolution') }}</span>
        <div class="flex flex-wrap gap-2">
          <button
            v-for="res in resolutionOptions"
            :key="res.value"
            @click="toggleResolution(res.value)"
            :class="[
              'px-3 py-1 rounded-lg text-sm font-medium transition-colors duration-200 cursor-pointer',
              selectedResolutions.includes(res.value)
                ? 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300'
                : 'bg-surface-100 text-surface-700 dark:bg-surface-700 dark:text-surface-300 hover:bg-surface-200 dark:hover:bg-surface-600'
            ]"
          >
            {{ res.label }}
          </button>
        </div>
      </div>

      <!-- 评分排序 -->
      <div class="flex items-center gap-3">
        <span class="text-base font-medium text-surface-700 dark:text-surface-300 whitespace-nowrap min-w-fit">{{ t('rating') }}</span>
        <div class="flex gap-2">
          <button
            v-for="sort in ratingSortOptions"
            :key="sort.value"
            @click="updateRatingSort(sort.value)"
            :class="[
              'px-3 py-1 rounded-lg text-sm font-medium transition-colors duration-200 cursor-pointer',
              selectedRatingSort === sort.value
                ? 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300'
                : 'bg-surface-100 text-surface-700 dark:bg-surface-700 dark:text-surface-300 hover:bg-surface-200 dark:hover:bg-surface-600'
            ]"
          >
            <i v-if="selectedRatingSort === sort.value" class="pi pi-check mr-1"></i>
            {{ sort.label }}
          </button>
        </div>
      </div>

      <!-- 文件大小排序 -->
      <div class="flex items-center gap-3">
        <span class="text-base font-medium text-surface-700 dark:text-surface-300 whitespace-nowrap min-w-fit">{{ t('file_size') }}</span>
        <div class="flex gap-2">
          <button
            v-for="sort in fileSizeSortOptions"
            :key="sort.value"
            @click="updateFileSizeSort(sort.value)"
            :class="[
              'px-3 py-1 rounded-lg text-sm font-medium transition-colors duration-200 cursor-pointer',
              selectedFileSizeSort === sort.value
                ? 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300'
                : 'bg-surface-100 text-surface-700 dark:bg-surface-700 dark:text-surface-300 hover:bg-surface-200 dark:hover:bg-surface-600'
            ]"
          >
            <i v-if="selectedFileSizeSort === sort.value" class="pi pi-check mr-1"></i>
            {{ sort.label }}
          </button>
        </div>
      </div>

      <!-- 重置按钮 -->
      <button
        @click="resetFilters"
        class="px-3 py-1 bg-surface-200 dark:bg-surface-700 text-surface-700 dark:text-surface-300 rounded-lg hover:bg-surface-300 dark:hover:bg-surface-600 transition-colors duration-200 text-xs font-medium cursor-pointer"
      >
        {{ t('reset') }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { t } from '../composables/useI18n'
import { computed } from 'vue'
import { useCloudDrives } from '../composables/useCloudDrives'

const emit = defineEmits<{
  'filter-change': [filters: FilterOptions]
}>()

interface FilterOptions {
  resourceTypes: string[]
  cloudDrives: string[]
  resolutions: string[]
  ratingSort: string
  fileSizeSort: string
}

// 使用公共网盘配置
const { cloudDrives } = useCloudDrives()

// 资源类型选项 - computed属性
const resourceTypeOptions = computed(() => [
  { label: t('bluray_original'), value: 'original' },
  { label: t('lossless_remux'), value: 'remux' },
  { label: t('high_quality_encode'), value: 'encode' },
  { label: t('web_version'), value: 'web' }
])

// 网盘选项 - computed属性
const cloudDriveOptions = computed(() => 
  cloudDrives.value.map(drive => ({
    label: drive.name,
    value: drive.code,
    logo: drive.logo
  }))
)

// 分辨率选项
const resolutionOptions = [
  { label: '8K', value: '8k' },
  { label: '4K', value: '4k' },
  { label: '1080p', value: '1080p' },
  { label: '1080i', value: '1080i' },
  { label: '720p', value: '720p' },
  { label: 'SD', value: 'sd' }
]

// 评分排序选项
const ratingSortOptions = computed(() => [
  { label: t('no_sort'), value: 'none' },
  { label: t('rating') + ' ' + t('desc'), value: 'rating_desc' },
  { label: t('rating') + ' ' + t('asc'), value: 'rating_asc' }
])

// 文件大小排序选项
const fileSizeSortOptions = computed(() => [
  { label: t('no_sort'), value: 'none' },
  { label: t('file_size') + ' ' + t('desc'), value: 'size_desc' },
  { label: t('file_size') + ' ' + t('asc'), value: 'size_asc' }
])

// 筛选状态
const selectedResourceTypes = ref<string[]>([])
const selectedCloudDrives = ref<string[]>([])
const selectedResolutions = ref<string[]>([])
const selectedRatingSort = ref('none')
const selectedFileSizeSort = ref('none')

// 防抖函数
let debounceTimer: NodeJS.Timeout | null = null

const debounceEmit = () => {
  if (debounceTimer) {
    clearTimeout(debounceTimer)
  }
  debounceTimer = setTimeout(() => {
    emitFilters()
  }, 300)
}

// 发出筛选事件
const emitFilters = () => {
  const filters: FilterOptions = {
    resourceTypes: selectedResourceTypes.value,
    cloudDrives: selectedCloudDrives.value,
    resolutions: selectedResolutions.value,
    ratingSort: selectedRatingSort.value,
    fileSizeSort: selectedFileSizeSort.value
  }
  emit('filter-change', filters)
}

// 切换资源类型选择
const toggleResourceType = (type: string) => {
  const index = selectedResourceTypes.value.indexOf(type)
  if (index > -1) {
    selectedResourceTypes.value.splice(index, 1)
  } else {
    selectedResourceTypes.value.push(type)
  }
  debounceEmit()
}

// 切换网盘选择
const toggleCloudDrive = (drive: string) => {
  const index = selectedCloudDrives.value.indexOf(drive)
  if (index > -1) {
    selectedCloudDrives.value.splice(index, 1)
  } else {
    selectedCloudDrives.value.push(drive)
  }
  debounceEmit()
}

// 切换分辨率选择
const toggleResolution = (resolution: string) => {
  const index = selectedResolutions.value.indexOf(resolution)
  if (index > -1) {
    selectedResolutions.value.splice(index, 1)
  } else {
    selectedResolutions.value.push(resolution)
  }
  debounceEmit()
}

// 更新评分排序
const updateRatingSort = (sort: string) => {
  selectedRatingSort.value = sort
  debounceEmit()
}

// 更新文件大小排序
const updateFileSizeSort = (sort: string) => {
  selectedFileSizeSort.value = sort
  debounceEmit()
}

// 重置筛选
const resetFilters = () => {
  selectedResourceTypes.value = []
  selectedCloudDrives.value = []
  selectedResolutions.value = []
  selectedRatingSort.value = 'none'
  selectedFileSizeSort.value = 'none'
  emitFilters()
}
</script>

<style scoped>
/* 自定义滑块样式 */
.slider::-webkit-slider-thumb {
  appearance: none;
  height: 20px;
  width: 20px;
  border-radius: 50%;
  background: var(--primary-color);
  cursor: pointer;
}

.slider::-moz-range-thumb {
  height: 20px;
  width: 20px;
  border-radius: 50%;
  background: var(--primary-color);
  cursor: pointer;
  border: none;
}
</style> 