<template>
  <div class="bg-surface-50 dark:bg-surface-950 min-h-screen">
    <!-- 背景头部 -->
    <div class="relative h-48 bg-gradient-to-b from-primary-500 to-transparent">
      <!-- 背景装饰 -->
      <div class="absolute inset-0"></div>
      
      <!-- 内容 -->
      <div class="relative h-full flex items-center justify-center">
        <div class="text-center text-white">
          <h1 class="text-5xl font-bold mb-4">
            {{ project?.name || projectDetails?.name || t('netdisk_applications') }}
          </h1>
          <p v-if="project" class="text-xl opacity-90">{{ project.claim_instructions?.substring(0, 100) }}</p>
        </div>
      </div>
      
      <!-- 底部渐变 -->
      <div class="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-b from-transparent to-surface-50 dark:to-surface-950"></div>
    </div>

    <div class="p-6">
      <div class="mx-auto">
        <!-- 加载状态 -->
        <div v-if="loading && !projectDetails" class="flex justify-center items-center py-20">
          <i class="pi pi-spin pi-spinner text-4xl text-primary"></i>
        </div>

        <!-- 错误状态 -->
        <div v-else-if="error" class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
          <p class="text-red-600 dark:text-red-400">{{ error }}</p>
        </div>

        <!-- 项目详情 -->
        <div v-else-if="projectDetails">

          <!-- 选项卡导航 -->
          <div class="mb-6">
            <div class="border-b border-surface-200 dark:border-surface-700">
              <nav class="flex space-x-8">
                <button
                  v-for="tab in tabs"
                  :key="tab.id"
                  @click="activeTab = tab.id"
                  class="py-2 px-1 border-b-2 font-medium text-sm transition-colors"
                  :class="activeTab === tab.id 
                    ? 'border-primary-500 text-primary-600 dark:text-primary-400' 
                    : 'border-transparent text-surface-500 hover:text-surface-700 hover:border-surface-300 dark:text-surface-400 dark:hover:text-surface-300'"
                >
                  <i :class="tab.icon" class="mr-2"></i>
                  {{ tab.name }}
                </button>
              </nav>
            </div>
          </div>

          <!-- 申请步骤选项卡 -->
          <div v-if="activeTab === 'steps' && project && project.claim_steps && project.claim_steps.length > 0" class="bg-surface-200 dark:bg-surface-800 rounded-lg shadow-sm p-6">
            <h3 class="text-xl font-semibold text-surface-900 dark:text-surface-0 mb-6">
              {{ t('claim_steps') }}
            </h3>
            <div class="space-y-4">
              <div
                v-for="(step, index) in project.claim_steps"
                :key="index"
                class="flex gap-4"
              >
                <div class="flex-shrink-0">
                  <div 
                    class="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold bg-primary-500"
                  >
                    {{ index + 1 }}
                  </div>
                </div>
                <div class="flex-1">
                  <h4 class="font-medium text-surface-900 dark:text-surface-0 mb-1">
                    {{ step.title }}
                  </h4>
                  <p class="text-surface-600 dark:text-surface-400">
                    {{ step.content }}
                  </p>
                  <img 
                    v-if="step.image" 
                    :src="step.image" 
                    :alt="step.title"
                    class="mt-2 rounded-lg max-w-full"
                  />
                </div>
              </div>
            </div>
          </div>

          <!-- 会员权益选项卡 -->
          <div v-if="activeTab === 'member' && project && project.member_benefits && project.member_benefits.rows.length > 0" class="bg-surface-200 dark:bg-surface-800 rounded-lg shadow-sm p-6">
            <h3 class="text-xl font-semibold text-surface-900 dark:text-surface-0 mb-6">
              {{ t('member_benefits') }}
            </h3>
            <div class="overflow-x-auto rounded-lg border border-surface-200 dark:border-surface-700">
              <table class="w-full">
                <thead>
                  <tr class="bg-surface-100 dark:bg-surface-800/50 border-b border-surface-200 dark:border-surface-700">
                    <th
                      v-for="column in project.member_benefits.columns"
                      :key="column.key"
                      class="px-6 py-4 text-left text-sm font-semibold text-surface-900 dark:text-surface-0 uppercase tracking-wider"
                    >
                      {{ column.label }}
                    </th>
                  </tr>
                </thead>
                <tbody class="bg-surface-0 dark:bg-surface-900 divide-y divide-surface-200 dark:divide-surface-700">
                  <tr
                    v-for="(row, index) in project.member_benefits.rows"
                    :key="index"
                    class="hover:bg-surface-50 dark:hover:bg-surface-800/50 transition-colors"
                  >
                    <td
                      v-for="column in project.member_benefits.columns"
                      :key="column.key"
                      class="px-6 py-4 whitespace-nowrap text-sm text-surface-700 dark:text-surface-300"
                    >
                      {{ row[column.key] }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- 容量权益选项卡 -->
          <div v-if="activeTab === 'capacity' && project && project.capacity_benefits && project.capacity_benefits.rows.length > 0" class="bg-surface-200 dark:bg-surface-800 rounded-lg shadow-sm p-6">
            <h3 class="text-xl font-semibold text-surface-900 dark:text-surface-0 mb-6">
              {{ t('capacity_benefits') }}
            </h3>
            <div class="overflow-x-auto rounded-lg border border-surface-200 dark:border-surface-700">
              <table class="w-full">
                <thead>
                  <tr class="bg-surface-100 dark:bg-surface-800/50 border-b border-surface-200 dark:border-surface-700">
                    <th
                      v-for="column in project.capacity_benefits.columns"
                      :key="column.key"
                      class="px-6 py-4 text-left text-sm font-semibold text-surface-900 dark:text-surface-0 uppercase tracking-wider"
                    >
                      {{ column.label }}
                    </th>
                  </tr>
                </thead>
                <tbody class="bg-surface-0 dark:bg-surface-900 divide-y divide-surface-200 dark:divide-surface-700">
                  <tr
                    v-for="(row, index) in project.capacity_benefits.rows"
                    :key="index"
                    class="hover:bg-surface-50 dark:hover:bg-surface-800/50 transition-colors"
                  >
                    <td
                      v-for="column in project.capacity_benefits.columns"
                      :key="column.key"
                      class="px-6 py-4 whitespace-nowrap text-sm text-surface-700 dark:text-surface-300"
                    >
                      {{ row[column.key] }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- 任务有效期选项卡 -->
          <div v-if="activeTab === 'task' && project && project.task_validity && project.task_validity.rows.length > 0" class="bg-surface-200 dark:bg-surface-800 rounded-lg shadow-sm p-6">
            <h3 class="text-xl font-semibold text-surface-900 dark:text-surface-0 mb-6">
              {{ t('task_validity') }}
            </h3>
            <div class="overflow-x-auto rounded-lg border border-surface-200 dark:border-surface-700">
              <table class="w-full">
                <thead>
                  <tr class="bg-surface-100 dark:bg-surface-800/50 border-b border-surface-200 dark:border-surface-700">
                    <th
                      v-for="column in project.task_validity.columns"
                      :key="column.key"
                      class="px-6 py-4 text-left text-sm font-semibold text-surface-900 dark:text-surface-0 uppercase tracking-wider"
                    >
                      {{ column.label }}
                    </th>
                  </tr>
                </thead>
                <tbody class="bg-surface-0 dark:bg-surface-900 divide-y divide-surface-200 dark:divide-surface-700">
                  <tr
                    v-for="(row, index) in project.task_validity.rows"
                    :key="index"
                    class="hover:bg-surface-50 dark:hover:bg-surface-800/50 transition-colors"
                  >
                    <td
                      v-for="column in project.task_validity.columns"
                      :key="column.key"
                      class="px-6 py-4 whitespace-nowrap text-sm text-surface-700 dark:text-surface-300"
                    >
                      {{ row[column.key] }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- 注意事项选项卡 -->
          <div v-if="activeTab === 'notes' && project && project.notes && project.notes.length > 0" class="bg-surface-200 dark:bg-surface-800 rounded-lg shadow-sm p-6">
            <h3 class="text-xl font-semibold text-surface-900 dark:text-surface-0 mb-6">
              {{ t('notes') }}
            </h3>
            <ul class="list-disc list-inside space-y-2 text-surface-700 dark:text-surface-300">
              <li v-for="(note, index) in project.notes" :key="index">
                {{ note }}
              </li>
            </ul>
          </div>

          <!-- 提交申请选项卡 -->
          <div v-if="activeTab === 'submit'" class="bg-surface-200 dark:bg-surface-800 rounded-lg shadow-sm p-6">
            <h3 class="text-xl font-semibold text-surface-900 dark:text-surface-0 mb-6">
              {{ t('submit_application') }}
            </h3>

            <form @submit.prevent="handleSubmit" class="space-y-6">
              <div
                v-for="field in projectDetails.application_fields"
                :key="field.field_key"
              >
                <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">
                  {{ field.field_label }}
                  <span v-if="field.is_required" class="text-red-500">*</span>
                </label>

                <!-- 文本输入 -->
                <input
                  v-if="field.field_type === 'text'"
                  v-model="formData[field.field_key]"
                  type="text"
                  :placeholder="field.placeholder"
                  :required="field.is_required"
                  class="w-full px-4 py-3 border border-surface-300 dark:border-surface-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-surface-50 dark:bg-surface-800 text-surface-900 dark:text-surface-100"
                />

                <!-- 文本域 -->
                <textarea
                  v-else-if="field.field_type === 'textarea'"
                  v-model="formData[field.field_key]"
                  :placeholder="field.placeholder"
                  :required="field.is_required"
                  rows="4"
                  class="w-full px-4 py-3 border border-surface-300 dark:border-surface-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-surface-50 dark:bg-surface-800 text-surface-900 dark:text-surface-100"
                ></textarea>

                <!-- 下拉选择 -->
                <select
                  v-else-if="field.field_type === 'select'"
                  v-model="formData[field.field_key]"
                  :required="field.is_required"
                  class="w-full px-4 py-3 border border-surface-300 dark:border-surface-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-surface-50 dark:bg-surface-800 text-surface-900 dark:text-surface-100"
                >
                  <option value="">{{ t('please_select') }}</option>
                  <option
                    v-for="option in field.field_options"
                    :key="option"
                    :value="option"
                  >
                    {{ option }}
                  </option>
                </select>

                <!-- 文件上传 -->
                <div v-else-if="field.field_type === 'file'">
                  <div class="relative">
                    <input
                      type="file"
                      :accept="'image/jpeg,image/jpg,image/png,image/gif,image/webp'"
                      @change="handleFileUpload($event, field.field_key)"
                      :required="field.is_required"
                      :disabled="uploadLoading[field.field_key]"
                      class="w-full px-4 py-3 border border-surface-300 dark:border-surface-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent bg-surface-50 dark:bg-surface-800 text-surface-900 dark:text-surface-100 disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                    <div v-if="uploadLoading[field.field_key]" class="absolute right-4 top-1/2 -translate-y-1/2">
                      <i class="pi pi-spin pi-spinner text-primary-500"></i>
                    </div>
                  </div>
                  <p class="mt-1 text-xs text-surface-500 dark:text-surface-400">
                    {{ t('image_upload_hint') }}
                  </p>
                  <div v-if="formData[field.field_key]" class="mt-3">
                    <img 
                      :src="formData[field.field_key]" 
                      alt="Preview"
                      class="max-w-xs rounded-lg border border-surface-200 dark:border-surface-700"
                    />
                    <button
                      type="button"
                      @click="formData[field.field_key] = undefined"
                      class="mt-2 text-sm text-red-500 hover:text-red-600 flex items-center gap-1"
                    >
                      <i class="pi pi-times"></i>
                      {{ t('remove_image') }}
                    </button>
                  </div>
                </div>
              </div>

              <!-- 提交按钮 -->
              <button
                type="submit"
                :disabled="submitLoading || !isFormValid"
                class="w-full px-6 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <i v-if="submitLoading" class="pi pi-spin pi-spinner mr-2"></i>
                {{ submitLoading ? t('submitting') : t('submit_application') }}
              </button>
              
              <!-- 提交错误提示 -->
              <div v-if="submitError" class="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p class="text-sm text-red-600 dark:text-red-400">{{ submitError }}</p>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useNetdiskApplications } from '../../composables/useNetdiskApplications'
import { useMoviCloudAPI, type NetdiskProject, type ApplicationField } from '../../composables/useMoviCloudAPI'
import { t } from '../../composables/useI18n'
import { useToast } from 'primevue/usetoast'
import { useDemoMode } from '../../composables/useDemoMode'

// 定义页面元信息，确保路由正确匹配
definePageMeta({
  key: (route) => `application-${route.params.id}`,
  name: 'application-id'
})

const route = useRoute()
const router = useRouter()
const { checkDemoPermission } = useDemoMode()

// 使用 computed 来响应路由参数变化
const projectId = computed(() => {
  const id = route.params.id
  if (Array.isArray(id)) {
    return parseInt(id[0])
  }
  return parseInt(id as string)
})

const { 
  projects,
  projectDetails, 
  loading, 
  error, 
  fetchProjects,
  fetchProjectDetails,
  submitApplication
} = useNetdiskApplications()

const { uploadNetdiskImage } = useMoviCloudAPI()
const toast = useToast()

const formData = ref<Record<string, any>>({})
const submitLoading = ref(false)
const submitError = ref<string | null>(null)
const uploadLoading = ref<Record<string, boolean>>({})

// 获取项目信息
const project = computed<NetdiskProject | null>(() => {
  return projects.value.find((p: NetdiskProject) => p.id === projectId.value) || null
})

// 选项卡配置
const tabs = computed(() => {
  const tabList = []
  
  if (project.value?.claim_steps && project.value.claim_steps.length > 0) {
    tabList.push({ id: 'steps', name: t('claim_steps'), icon: 'pi pi-list' })
  }
  
  if (project.value?.member_benefits && project.value.member_benefits.rows.length > 0) {
    tabList.push({ id: 'member', name: t('member_benefits'), icon: 'pi pi-star' })
  }
  
  if (project.value?.capacity_benefits && project.value.capacity_benefits.rows.length > 0) {
    tabList.push({ id: 'capacity', name: t('capacity_benefits'), icon: 'pi pi-database' })
  }
  
  if (project.value?.task_validity && project.value.task_validity.rows.length > 0) {
    tabList.push({ id: 'task', name: t('task_validity'), icon: 'pi pi-clock' })
  }
  
  if (project.value?.notes && project.value.notes.length > 0) {
    tabList.push({ id: 'notes', name: t('notes'), icon: 'pi pi-info-circle' })
  }
  
  // 提交申请始终显示
  tabList.push({ id: 'submit', name: t('submit_application'), icon: 'pi pi-send' })
  
  return tabList
})

const activeTab = ref('steps')

// 表单验证
const isFormValid = computed(() => {
  if (!projectDetails.value) return false
  
  return projectDetails.value.application_fields.every((field: ApplicationField) => {
    if (!field.is_required) return true
    const value = formData.value[field.field_key]
    return value !== undefined && value !== null && value !== ''
  })
})

// 处理文件上传
const handleFileUpload = async (event: Event, fieldKey: string) => {
  if (!checkDemoPermission()) return
  
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  
  if (!file) return
  
  // 验证文件类型
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
  if (!allowedTypes.includes(file.type)) {
    toast.add({
      severity: 'error',
      summary: t('error'),
      detail: t('invalid_image_format'),
      life: 3000
    })
    input.value = '' // 清空输入
    return
  }
  
  // 验证文件大小（5MB）
  const maxSize = 5 * 1024 * 1024
  if (file.size > maxSize) {
    toast.add({
      severity: 'error',
      summary: t('error'),
      detail: t('image_too_large'),
      life: 3000
    })
    input.value = '' // 清空输入
    return
  }
  
  uploadLoading.value[fieldKey] = true
  
  try {
    const result = await uploadNetdiskImage(file)
    formData.value[fieldKey] = result.url // 存储上传后的 URL
    
    toast.add({
      severity: 'success',
      summary: t('success'),
      detail: t('image_upload_success'),
      life: 2000
    })
  } catch (error: any) {
    toast.add({
      severity: 'error',
      summary: t('error'),
      detail: error.message || t('image_upload_failed'),
      life: 3000
    })
    input.value = '' // 清空输入
    formData.value[fieldKey] = undefined
  } finally {
    uploadLoading.value[fieldKey] = false
  }
}

// 处理表单提交
const handleSubmit = async () => {
  if (!checkDemoPermission()) return
  
  if (!isFormValid.value) return

  submitLoading.value = true
  submitError.value = null

  try {
    await submitApplication({
      project_id: projectId.value,
      application_materials: formData.value
    })
    
    // 提交成功，跳转到我的申请页面
    router.push('/my-applications')
  } catch (err: any) {
    submitError.value = err.message || '提交申请失败'
  } finally {
    submitLoading.value = false
  }
}

const handleImageError = (event: Event) => {
  const img = event.target as HTMLImageElement
  img.style.display = 'none'
}

// 加载项目数据的函数
const loadProjectData = async () => {
  const id = projectId.value
  await fetchProjects()
  await fetchProjectDetails(id)
  
  // 初始化表单数据
  if (projectDetails.value) {
    projectDetails.value.application_fields.forEach((field: ApplicationField) => {
      formData.value[field.field_key] = field.field_type === 'select' ? '' : ''
    })
  }
}

// 监听路由参数变化
watch(() => route.params.id, async (newId) => {
  if (newId) {
    // 重置状态
    formData.value = {}
    activeTab.value = 'steps'
    await loadProjectData()
  }
}, { immediate: true })

// 监听项目变化，设置默认 tab
watch(() => project.value, (newProject) => {
  if (newProject && tabs.value.length > 0) {
    // 设置第一个可用的 tab
    activeTab.value = tabs.value[0].id
  }
})

onMounted(async () => {
  await loadProjectData()
})

useHead({
  title: `${project.value?.name || t('netdisk_applications')} - MoviCloud`,
  meta: [
    { name: 'description', content: project.value?.claim_instructions || '' }
  ]
})
</script>
