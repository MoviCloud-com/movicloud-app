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
      <div v-else-if="myApplications.length > 0" class="space-y-6">
        <div
          v-for="application in myApplications"
          :key="application.id"
          class="bg-surface-0 dark:bg-surface-900 border border-surface-200 dark:border-surface-700 rounded-xl p-6"
        >
          <div class="flex items-start justify-between mb-4">
            <!-- 项目信息 -->
            <div class="flex items-center gap-4">
              <div class="w-16 h-16 rounded-lg flex items-center justify-center flex-shrink-0 bg-surface-100 dark:bg-surface-800">
                <img 
                  v-if="application.project.icon" 
                  :src="application.project.icon" 
                  :alt="application.project.name"
                  class="w-12 h-12 object-contain"
                  @error="handleImageError"
                />
                <i v-else class="pi pi-cloud text-2xl text-surface-400"></i>
              </div>
              <div>
                <h3 class="text-lg font-semibold text-surface-900 dark:text-surface-0 mb-1">
                  {{ application.project.name }}
                </h3>
                <p class="text-sm text-surface-600 dark:text-surface-400">
                  {{ t('application_id') }}: {{ application.id }}
                </p>
              </div>
            </div>

            <!-- 状态标签 -->
            <div>
              <span
                v-if="application.status === 'pending'"
                class="px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300"
              >
                <i class="pi pi-clock mr-1"></i>
                {{ t('pending') }}
              </span>
              <span
                v-else-if="application.status === 'approved'"
                class="px-3 py-1 rounded-full text-sm font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300"
              >
                <i class="pi pi-check-circle mr-1"></i>
                {{ t('approved') }}
              </span>
              <span
                v-else-if="application.status === 'rejected'"
                class="px-3 py-1 rounded-full text-sm font-medium bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300"
              >
                <i class="pi pi-times-circle mr-1"></i>
                {{ t('rejected') }}
              </span>
            </div>
          </div>

          <!-- 申请材料 -->
          <div class="mb-4">
            <h4 class="text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
              {{ t('application_materials') }}
            </h4>
            <div class="bg-surface-50 dark:bg-surface-800 rounded-lg p-4">
              <dl class="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div
                  v-for="(value, key) in application.application_materials"
                  :key="key"
                >
                  <dt class="text-xs text-surface-500 dark:text-surface-500 mb-1">
                    {{ formatFieldLabel(key) }}
                  </dt>
                  <dd class="text-sm text-surface-900 dark:text-surface-0">
                    <span v-if="isImage(value)" class="block">
                      <img 
                        :src="value" 
                        alt="Uploaded image"
                        class="max-w-xs rounded-lg border border-surface-200 dark:border-surface-700"
                      />
                    </span>
                    <span v-else>{{ value }}</span>
                  </dd>
                </div>
              </dl>
            </div>
          </div>

          <!-- 审核信息 -->
          <div v-if="application.status !== 'pending'" class="border-t border-surface-200 dark:border-surface-700 pt-4">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div v-if="application.reviewer">
                <span class="text-surface-500 dark:text-surface-500">{{ t('reviewer') }}:</span>
                <span class="ml-2 text-surface-900 dark:text-surface-0">{{ application.reviewer }}</span>
              </div>
              <div v-if="application.reviewed_at">
                <span class="text-surface-500 dark:text-surface-500">{{ t('reviewed_at') }}:</span>
                <span class="ml-2 text-surface-900 dark:text-surface-0">{{ formatDate(application.reviewed_at) }}</span>
              </div>
            </div>
            <div v-if="application.reject_reason" class="mt-3 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p class="text-sm text-red-600 dark:text-red-400">
                <strong>{{ t('reject_reason') }}:</strong> {{ application.reject_reason }}
              </p>
            </div>
          </div>

          <!-- 申请时间 -->
          <div class="mt-4 pt-4 border-t border-surface-200 dark:border-surface-700">
            <p class="text-xs text-surface-500 dark:text-surface-500">
              {{ t('created_at') }}: {{ formatDate(application.created_at) }}
            </p>
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
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useNetdiskApplications } from '../composables/useNetdiskApplications'
import { t } from '../composables/useI18n'

const router = useRouter()
const { 
  myApplications, 
  loading, 
  error, 
  fetchMyApplications 
} = useNetdiskApplications()

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

const isImage = (value: any) => {
  if (typeof value !== 'string') return false
  return value.startsWith('data:image/') || value.startsWith('http')
}

const handleImageError = (event: Event) => {
  const img = event.target as HTMLImageElement
  img.style.display = 'none'
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

