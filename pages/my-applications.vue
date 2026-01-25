<template>
  <div class="bg-surface-50 dark:bg-surface-950 min-h-screen">
    <!-- 背景头部 -->
    <div class="relative h-48 bg-gradient-to-b from-primary-500 to-transparent">
      <!-- 背景装饰 -->
      <div class="absolute inset-0"></div>
      
      <!-- 内容 -->
      <div class="relative h-full flex items-center justify-center">
        <div class="text-center text-white">
          <h1 class="text-5xl font-bold mb-4">{{ t('my_applications') }}</h1>
          <p class="text-xl opacity-90">{{ t('my_applications_subtitle') }}</p>
        </div>
      </div>
      
      <!-- 底部渐变 -->
      <div class="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-b from-transparent to-surface-50 dark:to-surface-950"></div>
    </div>

    <div class="p-6">

      <!-- 加载状态 -->
      <div v-if="loading && myApplications.length === 0" class="flex justify-center items-center py-20">
        <i class="pi pi-spin pi-spinner text-4xl text-primary"></i>
      </div>

      <!-- 错误状态 -->
      <div v-else-if="error" class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
        <p class="text-red-600 dark:text-red-400">{{ error }}</p>
      </div>

      <!-- 申请列表 -->
      <div v-else-if="myApplications.length > 0" class="space-y-4 mx-auto">
        <div
          v-for="application in myApplications"
          :key="application.id"
          @click="openApplicationDetail(application)"
          class="bg-surface-0 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-xl shadow-sm hover:shadow-md transition-all cursor-pointer hover:border-primary-300 dark:hover:border-primary-700"
        >
          <!-- 卡片内容 -->
          <div class="p-5">
            <div class="flex items-center justify-between">
              <!-- 左侧：项目信息 -->
              <div class="flex items-center gap-4 flex-1 min-w-0">
                <div 
                  class="w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm"
                  :style="{ backgroundColor: application.project.theme_color + '15' }"
                >
                  <img 
                    v-if="application.project.icon" 
                    :src="application.project.icon" 
                    :alt="application.project.name"
                    class="w-10 h-10 object-contain rounded-lg"
                    @error="handleImageError"
                  />
                  <i v-else class="pi pi-cloud text-xl" :style="{ color: application.project.theme_color }"></i>
                </div>
                <div class="flex-1 min-w-0">
                  <h3 class="text-lg font-semibold text-surface-900 dark:text-surface-0 mb-1 truncate">
                    {{ application.project.name }}
                  </h3>
                  <div class="flex items-center gap-3 text-xs text-surface-500 dark:text-surface-400">
                    <span class="flex items-center gap-1">
                      <i class="pi pi-hashtag"></i>
                      {{ t('application_id') }}: {{ application.id }}
                    </span>
                    <span class="flex items-center gap-1">
                      <i class="pi pi-calendar"></i>
                      {{ formatDate(application.created_at) }}
                    </span>
                  </div>
                </div>
              </div>

              <!-- 右侧：状态和操作 -->
              <div class="flex items-center gap-3 ml-4 flex-shrink-0">
                <!-- 状态标签 -->
                <span
                  v-if="application.status === 'pending'"
                  class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 border border-yellow-200 dark:border-yellow-800"
                >
                  <i class="pi pi-clock text-xs"></i>
                  {{ t('pending') }}
                </span>
                <span
                  v-else-if="application.status === 'approved'"
                  class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border border-green-200 dark:border-green-800"
                >
                  <i class="pi pi-check-circle text-xs"></i>
                  {{ t('approved') }}
                </span>
                <span
                  v-else-if="application.status === 'rejected'"
                  class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-800"
                >
                  <i class="pi pi-times-circle text-xs"></i>
                  {{ t('rejected') }}
                </span>
                
                <!-- 查看详情图标 -->
                <i class="pi pi-chevron-right text-surface-400"></i>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-else class="text-center py-20">
        <i class="pi pi-inbox text-6xl text-surface-400 mb-4"></i>
        <p class="text-surface-600 dark:text-surface-400 mb-4">{{ t('no_applications') }}</p>
        <button
          @click="router.push('/netdisk-applications')"
          class="px-6 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
        >
          {{ t('apply_now') }}
        </button>
      </div>
    </div>

    <!-- 申请详情弹窗 -->
    <Dialog
      v-model:visible="showDetailDialog"
      :modal="true"
      :header="selectedApplication ? `${selectedApplication.project.name} - ${t('application_details')}` : ''"
      :style="{ width: '90vw', maxWidth: '900px' }"
      class="application-detail-dialog"
    >
      <div v-if="selectedApplication" class="space-y-6">
        <!-- 基本信息 -->
        <div class="flex items-center justify-between pb-4 border-b border-surface-200 dark:border-surface-700">
          <div class="flex items-center gap-4">
            <div 
              class="w-16 h-16 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm"
              :style="{ backgroundColor: selectedApplication.project.theme_color + '15' }"
            >
              <img 
                v-if="selectedApplication.project.icon" 
                :src="selectedApplication.project.icon" 
                :alt="selectedApplication.project.name"
                class="w-12 h-12 object-contain rounded-lg"
                @error="handleImageError"
              />
              <i v-else class="pi pi-cloud text-2xl" :style="{ color: selectedApplication.project.theme_color }"></i>
            </div>
            <div>
              <h3 class="text-xl font-semibold text-surface-900 dark:text-surface-0 mb-1">
                {{ selectedApplication.project.name }}
              </h3>
              <div class="flex items-center gap-4 text-sm text-surface-500 dark:text-surface-400">
                <span class="flex items-center gap-1">
                  <i class="pi pi-hashtag text-xs"></i>
                  {{ t('application_id') }}: {{ selectedApplication.id }}
                </span>
                <span class="flex items-center gap-1">
                  <i class="pi pi-calendar text-xs"></i>
                  {{ formatDate(selectedApplication.created_at) }}
                </span>
              </div>
            </div>
          </div>
          <span
            v-if="selectedApplication.status === 'pending'"
            class="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 border border-yellow-200 dark:border-yellow-800"
          >
            <i class="pi pi-clock text-xs"></i>
            {{ t('pending') }}
          </span>
          <span
            v-else-if="selectedApplication.status === 'approved'"
            class="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border border-green-200 dark:border-green-800"
          >
            <i class="pi pi-check-circle text-xs"></i>
            {{ t('approved') }}
          </span>
          <span
            v-else-if="selectedApplication.status === 'rejected'"
            class="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-800"
          >
            <i class="pi pi-times-circle text-xs"></i>
            {{ t('rejected') }}
          </span>
        </div>

        <!-- 申请材料 -->
        <div>
          <h4 class="text-sm font-semibold text-surface-700 dark:text-surface-300 mb-4 flex items-center gap-2">
            <i class="pi pi-file text-primary-500"></i>
            {{ t('application_materials') }}
          </h4>
          <div class="bg-surface-50 dark:bg-surface-800 rounded-lg p-5 border border-surface-200 dark:border-surface-700">
            <dl class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div
                v-for="material in getApplicationMaterials(selectedApplication.application_materials)"
                :key="material.key"
                class="pb-3 border-b border-surface-200 dark:border-surface-700 last:border-b-0 last:pb-0"
              >
                <dt class="text-xs font-medium text-surface-600 dark:text-surface-400 mb-2 uppercase tracking-wider">
                  {{ material.label }}
                </dt>
                <dd class="text-sm text-surface-900 dark:text-surface-0 break-words">
                  <span v-if="isImage(material.value)" class="block">
                    <div class="relative inline-block group" @click.stop="openImagePreview(material.value, $event)">
                      <img 
                        :src="material.value" 
                        alt="Uploaded image"
                        class="max-w-[200px] max-h-[200px] rounded-lg border border-surface-200 dark:border-surface-700 shadow-sm hover:shadow-md transition-all cursor-pointer object-cover"
                      />
                      <div class="absolute inset-0 bg-black/0 hover:bg-black/10 rounded-lg transition-colors flex items-center justify-center pointer-events-none">
                        <i class="pi pi-search-plus text-white opacity-0 group-hover:opacity-100 transition-opacity text-2xl"></i>
                      </div>
                    </div>
                  </span>
                  <span v-else class="font-mono text-xs bg-surface-100 dark:bg-surface-700 px-2 py-1 rounded break-all">{{ material.value }}</span>
                </dd>
              </div>
            </dl>
          </div>
        </div>

        <!-- 审核信息 -->
        <div v-if="selectedApplication.status !== 'pending'">
          <h4 class="text-sm font-semibold text-surface-700 dark:text-surface-300 mb-4 flex items-center gap-2">
            <i class="pi pi-verified text-primary-500"></i>
            {{ t('review_info') }}
          </h4>
          <div class="bg-surface-50 dark:bg-surface-800 rounded-lg p-5 border border-surface-200 dark:border-surface-700">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div v-if="selectedApplication.reviewer" class="flex items-center gap-2">
                <i class="pi pi-user text-surface-400"></i>
                <span class="text-xs text-surface-500 dark:text-surface-500">{{ t('reviewer') }}:</span>
                <span class="text-sm font-medium text-surface-900 dark:text-surface-0">
                  {{ typeof selectedApplication.reviewer === 'object' ? selectedApplication.reviewer.username : selectedApplication.reviewer }}
                </span>
              </div>
              <div v-if="selectedApplication.reviewed_at" class="flex items-center gap-2">
                <i class="pi pi-calendar text-surface-400"></i>
                <span class="text-xs text-surface-500 dark:text-surface-500">{{ t('reviewed_at') }}:</span>
                <span class="text-sm font-medium text-surface-900 dark:text-surface-0">{{ formatDate(selectedApplication.reviewed_at) }}</span>
              </div>
            </div>
            <div v-if="selectedApplication.reject_reason" class="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <div class="flex items-start gap-2">
                <i class="pi pi-exclamation-triangle text-red-500 mt-0.5"></i>
                <div>
                  <p class="text-xs font-semibold text-red-700 dark:text-red-400 mb-1">{{ t('reject_reason') }}</p>
                  <p class="text-sm text-red-600 dark:text-red-400">{{ selectedApplication.reject_reason }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Dialog>

    <!-- 图片预览弹窗 -->
    <Dialog
      v-model:visible="showImagePreview"
      :modal="true"
      :header="t('image_preview')"
      :style="{ width: '95vw', maxWidth: '1200px' }"
      class="image-preview-dialog"
      @hide="closeImagePreview"
    >
      <div class="flex items-center justify-center bg-surface-50 dark:bg-surface-900 p-4 rounded-lg">
        <img 
          v-if="previewImageUrl"
          :src="previewImageUrl" 
          alt="Preview"
          class="max-w-full max-h-[80vh] object-contain rounded-lg shadow-lg"
        />
      </div>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useNetdiskApplications } from '../composables/useNetdiskApplications'
import { t } from '../composables/useI18n'
import Dialog from '../volt/Dialog.vue'

const router = useRouter()
const { 
  myApplications, 
  loading, 
  error, 
  fetchMyApplications 
} = useNetdiskApplications()

// 弹窗状态
const showDetailDialog = ref(false)
const selectedApplication = ref<any>(null)

const formatDate = (dateString: string) => {
  const date = new Date(dateString)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const formatFieldLabel = (key: string) => {
  // 将字段key转换为可读的标签
  return key
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

// 处理申请材料，支持数组和对象两种格式
const getApplicationMaterials = (materials: any) => {
  if (!materials) return []
  
  // 如果是数组格式（新格式）
  if (Array.isArray(materials)) {
    return materials
  }
  
  // 如果是对象格式（旧格式），转换为数组
  return Object.entries(materials).map(([key, value]) => ({
    key,
    label: formatFieldLabel(key),
    value
  }))
}

const isImage = (value: any) => {
  if (typeof value !== 'string') return false
  return value.startsWith('data:image/') || value.startsWith('http') || value.startsWith('https')
}

const handleImageError = (event: Event) => {
  const img = event.target as HTMLImageElement
  img.style.display = 'none'
}

// 图片预览状态
const showImagePreview = ref(false)
const previewImageUrl = ref('')

const openImagePreview = (imageUrl: string, event?: Event) => {
  if (event) {
    event.stopPropagation()
  }
  previewImageUrl.value = imageUrl
  showImagePreview.value = true
}

const closeImagePreview = () => {
  showImagePreview.value = false
  previewImageUrl.value = ''
}

const openApplicationDetail = (application: any) => {
  selectedApplication.value = application
  showDetailDialog.value = true
}

onMounted(() => {
  fetchMyApplications()
})

useHead({
  title: `${t('my_applications')} - MoviCloud`,
  meta: [
    { name: 'description', content: t('my_applications_subtitle') }
  ]
})
</script>

