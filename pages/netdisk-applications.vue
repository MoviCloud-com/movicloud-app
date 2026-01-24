<template>
  <div class="bg-surface-50 dark:bg-surface-950 min-h-screen">
    <!-- 背景头部 -->
    <div class="relative h-48 bg-gradient-to-b from-primary-500 to-transparent">
      <!-- 背景装饰 -->
      <div class="absolute inset-0"></div>
      
      <!-- 内容 -->
      <div class="relative h-full flex items-center justify-center">
        <div class="text-center text-white">
          <h1 class="text-5xl font-bold mb-4">{{ t('netdisk_applications') }}</h1>
          <p class="text-xl opacity-90">{{ t('netdisk_applications_subtitle') }}</p>
        </div>
      </div>
      
      <!-- 底部渐变 -->
      <div class="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-b from-transparent to-surface-50 dark:to-surface-950"></div>
    </div>

    <div class="p-6">
      <!-- 加载状态 -->
      <div v-if="loading && projects.length === 0" class="flex justify-center items-center py-20">
        <i class="pi pi-spin pi-spinner text-4xl text-primary"></i>
      </div>

      <!-- 错误状态 -->
      <div v-else-if="error" class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
        <p class="text-red-600 dark:text-red-400">{{ error }}</p>
      </div>

      <!-- 项目列表 -->
      <div v-else-if="activeProjects.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        <router-link
          v-for="project in activeProjects"
          :key="project.id"
          :to="`/application/${project.id}`"
          class="group relative overflow-hidden rounded-xl cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-xl block border-2"
          :style="{
            backgroundColor: project.theme_color + '15',
            borderColor: project.theme_color + '30'
          }"
        >
          <!-- 背景渐变 -->
          <div 
            class="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-0"
            :style="{
              background: `linear-gradient(135deg, ${project.theme_color}20 0%, ${project.theme_color}05 100%)`
            }"
          ></div>
          
          <!-- 内容 -->
          <div class="relative p-8 flex flex-col items-center justify-center min-h-[200px] z-10">
            <!-- Logo -->
            <div 
              class="w-20 h-20 rounded-2xl flex items-center justify-center mb-4 shadow-lg transition-transform duration-300 group-hover:scale-110"
              :style="{ 
                backgroundColor: project.theme_color + '20',
                border: `2px solid ${project.theme_color}40`
              }"
            >
              <img 
                v-if="project.icon" 
                :src="project.icon" 
                :alt="project.name"
                class="w-14 h-14 object-contain rounded-xl"
                @error="handleImageError"
              />
              <i v-else class="pi pi-cloud text-4xl" :style="{ color: project.theme_color }"></i>
            </div>
            
            <!-- 网盘名称 -->
            <h3 
              class="text-xl font-bold text-center"
              :style="{ color: project.theme_color }"
            >
              {{ project.name }}
            </h3>
          </div>
          
          <!-- 底部装饰条 -->
          <div 
            class="absolute bottom-0 left-0 right-0 h-1"
            :style="{ backgroundColor: project.theme_color }"
          ></div>
        </router-link>
      </div>

      <!-- 空状态 -->
      <div v-else class="text-center py-20">
        <i class="pi pi-inbox text-6xl text-surface-400 mb-4"></i>
        <p class="text-surface-600 dark:text-surface-400">{{ t('no_projects_available') }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useNetdiskApplications } from '../composables/useNetdiskApplications'
import { t } from '../composables/useI18n'

// 明确这是列表页面
definePageMeta({
  name: 'netdisk-applications'
})

const { 
  projects, 
  activeProjects, 
  loading, 
  error, 
  fetchProjects 
} = useNetdiskApplications()

const handleImageError = (event: Event) => {
  const img = event.target as HTMLImageElement
  img.style.display = 'none'
}

onMounted(() => {
  fetchProjects()
})

useHead({
  title: `${t('netdisk_applications')} - MoviCloud`,
  meta: [
    { name: 'description', content: t('netdisk_applications_subtitle') }
  ]
})
</script>
