<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { t } from '../composables/useI18n'
import { useToast } from 'primevue/usetoast'
import { useMediaInfo } from '../composables/useMediaInfo'
import { useMoviCloudAPI } from '../composables/useMoviCloudAPI'
import { useTMDBClient } from '../composables/useTMDBClient'
import { useCloudFileManagement } from '../composables/useCloudFileManagement'
import Dialog from '../volt/Dialog.vue'
import Button from '../volt/Button.vue'
import InputText from '../volt/InputText.vue'
import SelectButton from '../volt/SelectButton.vue'
import type { CloudFile, CloudDriveAccount } from '../composables/useCloudFileManagement'

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
const { resourceTypes, resolutions, videoCodecs, audioCodecs } = useMediaInfo()
const { submitMovieResource, submitTVResource } = useMoviCloudAPI()
const { getTVShowDetails } = useTMDBClient()
const { createShare } = useCloudFileManagement()

const tmdbSearchQuery = ref('')
const tmdbSearchResults = ref<any[]>([])
const tmdbSearching = ref(false)
const selectedMedia = ref<any>(null)
const submitting = ref(false)

const resourceForm = ref({
  resourceType: 'original',
  driveName: '',
  season: 'all',
  fileSize: '',
  fileSizeUnit: 'GB',
  resolution: '',
  videoCodec: '',
  audioCodec: ''
})

const fileSizeUnits = [
  { label: 'GB', value: 'GB' },
  { label: 'MB', value: 'MB' }
]

const seasonOptions = computed(() => {
  if (selectedMedia.value?.media_type === 'tv' && selectedMedia.value?.seasons) {
    const options = [
      { label: t('full_series'), value: 'all' }
    ]
    
    selectedMedia.value.seasons.forEach((season: any) => {
      options.push({
        label: t('season_number', { number: season.season_number }),
        value: season.season_number.toString()
      })
    })
    
    return options
  }
  return [
    { label: t('all_seasons'), value: 'all' },
    { label: t('season_1'), value: '1' },
    { label: t('season_2'), value: '2' },
    { label: t('season_3'), value: '3' }
  ]
})

const cloudDrives = [
  { code: 'quark', name: '夸克网盘', logo: '/images/cloud-drives/quark.png' },
  { code: 'uc', name: 'UC网盘', logo: '/images/cloud-drives/uc.png' }
]

watch(() => props.visible, (newVal) => {
  if (newVal) {
    tmdbSearchQuery.value = ''
    tmdbSearchResults.value = []
    selectedMedia.value = null
    resourceForm.value = {
      resourceType: 'original',
      driveName: props.account?.driveCode || '',
      season: 'all',
      fileSize: '',
      fileSizeUnit: 'GB',
      resolution: '',
      videoCodec: '',
      audioCodec: ''
    }
    
    if (props.file && !props.file.dir && props.file.size > 0) {
      resourceForm.value.fileSize = formatFileSizeToGB(props.file.size)
    }
  }
})

const formatFileSizeToGB = (bytes: number): string => {
  const gb = bytes / (1024 * 1024 * 1024)
  return gb.toFixed(2)
}

const searchTMDB = async () => {
  if (!tmdbSearchQuery.value.trim()) return
  
  try {
    tmdbSearching.value = true
    
    const response = await $fetch<{ success: boolean; data?: { results?: any[] }; message?: string }>('/api/tmdb', {
      params: {
        action: 'search',
        query: tmdbSearchQuery.value
      }
    })
    
    if (response.success && response.data && response.data.results) {
      tmdbSearchResults.value = response.data.results
    }
  } catch (err) {
    toast.add({
      severity: 'error',
      summary: t('error'),
      detail: t('search_failed'),
      life: 3000
    })
  } finally {
    tmdbSearching.value = false
  }
}

const selectMedia = async (media: any) => {
  if (media.media_type === 'tv') {
    try {
      const details = await getTVShowDetails(media.id)
      selectedMedia.value = { ...media, ...details }
    } catch (err) {
      console.error('获取电视剧详情失败:', err)
      selectedMedia.value = media
    }
  } else {
    selectedMedia.value = media
  }
}

const handleSubmit = async () => {
  if (!props.file || !selectedMedia.value || !props.account) return
  
  try {
    if (!resourceForm.value.driveName) {
      toast.add({ 
        severity: 'warn', 
        summary: t('notice'), 
        detail: t('please_select_cloud_drive'), 
        life: 3000 
      })
      return
    }
    if (!resourceForm.value.fileSize) {
      toast.add({ 
        severity: 'warn', 
        summary: t('notice'), 
        detail: t('please_enter_file_size'), 
        life: 3000 
      })
      return
    }
    if (!resourceForm.value.resolution) {
      toast.add({ 
        severity: 'warn', 
        summary: t('notice'), 
        detail: t('please_select_resolution'), 
        life: 3000 
      })
      return
    }
    if (!resourceForm.value.videoCodec) {
      toast.add({ 
        severity: 'warn', 
        summary: t('notice'), 
        detail: t('please_select_video_codec'), 
        life: 3000 
      })
      return
    }
    if (!resourceForm.value.audioCodec) {
      toast.add({ 
        severity: 'warn', 
        summary: t('notice'), 
        detail: t('please_select_audio_codec'), 
        life: 3000 
      })
      return
    }
    
    submitting.value = true
    
    const shareResult = await createShare(props.account, props.file.fid, '', 1)
    
    if (!shareResult.success || !shareResult.data) {
      throw new Error(shareResult.message || '创建分享失败')
    }
    
    const shareUrl = shareResult.data.share_url
    
    const resourceData: any = {
      mediaId: selectedMedia.value.id,
      resourceType: resourceForm.value.resourceType,
      cloudDriveCode: resourceForm.value.driveName,
      driveLink: shareUrl,
      resolution: resourceForm.value.resolution,
      fileSize: `${resourceForm.value.fileSize}${resourceForm.value.fileSizeUnit}`,
      videoCodec: resourceForm.value.videoCodec,
      audioCodec: resourceForm.value.audioCodec
    }
    
    if (selectedMedia.value.media_type === 'tv') {
      resourceData.seasonNumber = resourceForm.value.season === 'all' 
        ? selectedMedia.value.id
        : parseInt(resourceForm.value.season || '1')
    }
    
    let result
    if (selectedMedia.value.media_type === 'movie') {
      result = await submitMovieResource(resourceData)
    } else {
      result = await submitTVResource(resourceData)
    }
    
    toast.add({
      severity: 'success',
      summary: t('success'),
      detail: '资源提交成功！等待审核通过后即可显示。',
      life: 3000
    })
    
    emit('update:visible', false)
    emit('success')
  } catch (err: any) {
    toast.add({
      severity: 'error',
      summary: t('error'),
      detail: err.message || t('share_and_upload_failed'),
      life: 3000
    })
  } finally {
    submitting.value = false
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
    :header="selectedMedia ? `《${selectedMedia.title || selectedMedia.name}》${t('submit_resource')}` : t('share_and_upload')"
    maximizable
    modal
    class="md:w-300 w-9/10"
    pt:mask="backdrop-blur-sm"
    @hide="handleClose"
  >
    <div class="space-y-6">
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

      <!-- TMDB搜索 -->
      <div v-if="!selectedMedia">
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
          {{ t('search_media') }}
        </label>
        <div class="flex gap-3">
          <InputText
            v-model="tmdbSearchQuery"
            :placeholder="t('enter_movie_or_tv_name')"
            class="flex-1"
            @keyup.enter="searchTMDB"
          />
          <Button
            :label="t('search')"
            icon="pi pi-search"
            :loading="tmdbSearching"
            @click="searchTMDB"
          />
        </div>
      </div>

      <!-- TMDB搜索结果 -->
      <div v-if="tmdbSearchResults.length > 0 && !selectedMedia" class="max-h-64 overflow-y-auto space-y-2">
        <div
          v-for="media in tmdbSearchResults"
          :key="media.id"
          @click="selectMedia(media)"
          class="p-3 bg-surface-50 dark:bg-surface-800 hover:bg-surface-100 dark:hover:bg-surface-700 rounded-lg cursor-pointer transition-all"
        >
          <div class="flex items-center gap-3">
            <img
              v-if="media.poster_path"
              :src="`https://image.tmdb.org/t/p/w92${media.poster_path}`"
              :alt="media.title || media.name"
              class="w-12 h-16 object-cover rounded"
            />
            <div v-else class="w-12 h-16 bg-surface-200 dark:bg-surface-700 rounded flex items-center justify-center">
              <i class="pi pi-image text-surface-400"></i>
            </div>
            <div class="flex-1">
              <div class="font-medium text-surface-900 dark:text-surface-0">
                {{ media.title || media.name }}
              </div>
              <div class="text-sm text-surface-600 dark:text-surface-400">
                {{ media.release_date || media.first_air_date }} · 
                {{ media.media_type === 'movie' ? t('movie') : t('tv') }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 选中的媒体 -->
      <div v-if="selectedMedia" class="p-3 bg-primary-50 dark:bg-primary-900/20 rounded-lg">
        <div class="flex items-center gap-3">
          <img
            v-if="selectedMedia.poster_path"
            :src="`https://image.tmdb.org/t/p/w92${selectedMedia.poster_path}`"
            :alt="selectedMedia.title || selectedMedia.name"
            class="w-12 h-16 object-cover rounded"
          />
          <div class="flex-1">
            <div class="font-medium text-surface-900 dark:text-surface-0">
              {{ selectedMedia.title || selectedMedia.name }}
            </div>
            <div class="text-sm text-surface-600 dark:text-surface-400">
              {{ selectedMedia.release_date || selectedMedia.first_air_date }} · 
              {{ selectedMedia.media_type === 'movie' ? t('movie') : t('tv') }}
            </div>
          </div>
          <Button
            icon="pi pi-times"
            severity="secondary"
            text
            rounded
            @click="selectedMedia = null"
          />
        </div>
      </div>

      <!-- 资源表单 -->
      <div v-if="selectedMedia" class="space-y-6">
        <!-- 资源类型 -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            {{ t('resource_type') }}
          </label>
          <SelectButton
            v-model="resourceForm.resourceType"
            :options="resourceTypes"
            optionLabel="label"
            optionValue="code"
            class="w-full"
          />
        </div>

        <!-- 网盘选择 -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            {{ t('select_cloud_drive') }}
          </label>
          <SelectButton
            v-model="resourceForm.driveName"
            :options="cloudDrives"
            optionLabel="name"
            optionValue="code"
            dataKey="code"
            class="w-full"
          >
            <template #option="slotProps">
              <div class="flex items-center gap-2">
                <img
                  v-if="slotProps.option.logo"
                  :src="slotProps.option.logo"
                  :alt="slotProps.option.name"
                  class="w-5 h-5 rounded-md"
                />
                <span>{{ slotProps.option.name }}</span>
              </div>
            </template>
          </SelectButton>
        </div>

        <!-- 季数选择（仅电视剧） -->
        <div v-if="selectedMedia.media_type === 'tv' && selectedMedia.seasons">
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            {{ t('select_season') }}
          </label>
          <SelectButton
            v-model="resourceForm.season"
            :options="seasonOptions"
            optionLabel="label"
            optionValue="value"
            class="w-full"
          />
        </div>

        <!-- 文件大小 -->
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {{ t('file_size') }}
            </label>
            <InputText
              v-model="resourceForm.fileSize"
              type="number"
              :placeholder="t('please_enter_file_size')"
              class="w-full"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {{ t('unit') }}
            </label>
            <SelectButton
              v-model="resourceForm.fileSizeUnit"
              :options="fileSizeUnits"
              optionLabel="label"
              optionValue="value"
              class="w-full"
            />
          </div>
        </div>

        <!-- 分辨率 -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            {{ t('resolution') }}
          </label>
          <SelectButton
            v-model="resourceForm.resolution"
            :options="resolutions"
            optionLabel="label"
            optionValue="code"
            class="w-full"
          />
        </div>

        <!-- 视频编码 -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            {{ t('video_codec') }}
          </label>
          <SelectButton
            v-model="resourceForm.videoCodec"
            :options="videoCodecs"
            optionLabel="label"
            optionValue="code"
            class="w-full"
          />
        </div>

        <!-- 音频编码 -->
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            {{ t('audio_codec') }}
          </label>
          <SelectButton
            v-model="resourceForm.audioCodec"
            :options="audioCodecs"
            optionLabel="label"
            optionValue="code"
            class="w-full"
          />
        </div>
      </div>
    </div>

    <template #footer>
      <div class="flex gap-4">
        <button
          @click="handleSubmit"
          :disabled="!selectedMedia || submitting"
          class="flex-1 px-6 py-3 bg-primary-500 hover:bg-primary-600 disabled:bg-primary-300 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
        >
          <i class="pi pi-check text-lg"></i>
          {{ t('submit_resource') }}
        </button>
        <button
          @click="handleClose"
          class="px-6 py-3 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-lg transition-colors duration-200"
        >
          {{ t('cancel') }}
        </button>
      </div>
    </template>
  </Dialog>
</template>
