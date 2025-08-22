<script setup lang="ts">
import type { TMDBMovie, TMDBSeries } from '../../types'
import MediaCard from '../../components/MediaCard.vue'
import Dialog from '../../volt/Dialog.vue'
import SelectButton from '../../volt/SelectButton.vue'
import InputText from '../../volt/InputText.vue'
import Card from '../../volt/Card.vue'
import { ref, onMounted, onUnmounted, computed, nextTick, watch } from 'vue'
import { t } from '../../composables/useI18n'
import { useRoute } from 'vue-router'
import { useToast } from 'primevue/usetoast'
import { useTMDBClient } from '../../composables/useTMDBClient'
import { useCloudDrives } from '../../composables/useCloudDrives'
import { useMoviCloudAPI, type ResourceItem } from '../../composables/useMoviCloudAPI'
import CloudDriveFilter from '../../components/CloudDriveFilter.vue'
import { useCountryTranslation } from '../../composables/useCountryTranslation'
import { useSettingsCache } from '../../composables/useSettingsCache'
import ImageLazy from '../../components/ImageLazy.vue'

// 获取路由参数
const route = useRoute()
const type = route.params.type as 'movie' | 'tv'
const id = parseInt(route.params.id as string)

// 获取TMDB服务
const { 
  getMovieDetails, 
  getTVShowDetails, 
  getMovieImages, 
  getTVShowImages, 
  getImageUrl, 
  getBackdropUrl, 
  getLogoUrl
} = useTMDBClient()

// 响应式数据
const mediaDetails = ref<any>(null)

// 页面元数据
useHead(() => ({
  title: mediaDetails.value ? `${mediaDetails.value.title || mediaDetails.value.name} - MoviCloud` : `${type === 'movie' ? t('movie') : t('tv_show')} - MoviCloud`,
  meta: [
    { name: 'description', content: mediaDetails.value?.overview || '' }
  ]
}))
const mediaImages = ref<any>(null)
const recommendations = ref<any[]>([])
const similar = ref<any[]>([])
const loading = ref(true)
const error = ref('')

// 演职人员滚动相关
const castScrollContainer = ref<HTMLElement>()
// 季数列表滚动相关
const seasonsScrollContainer = ref<HTMLElement>()
const canScrollLeft = ref(false)
const canScrollRight = ref(false)

// 季数详情弹窗相关
const selectedSeason = ref<any>(null)
const seasonDetailVisible = ref(false)
const scrollTimeout = ref<NodeJS.Timeout>()

// 模态框状态
const showDownloadModal = ref(false)
const showRatingModal = ref(false)
const showReportModal = ref(false)
const isMaximized = ref(false)

// 当前操作资源
const currentResource = ref<ResourceItem | null>(null)

// 提交资源模态框相关
const showSubmitModal = ref(false)

// 评分模态框相关
const showRateModal = ref(false)
const currentRating = ref(0)
const ratingComment = ref('')
const ratingDriveName = ref('')

// 举报模态框相关
const reportReason = ref('')
const reportComment = ref('')
const reportDriveName = ref('')
const submitForm = ref({
  resourceType: 'original',
  driveName: '',
  link: '',
  season: type === 'tv' ? 'all' : null, // 电视剧时选择季数
  fileSize: '',
  fileSizeUnit: 'GB',
  resolution: '',
  videoCodec: '',
  audioCodec: ''
})

// 使用公共网盘配置
const { cloudDrives, getDriveById } = useCloudDrives()

// 使用设置缓存
const { tmdbImageBaseUrl, initializeSettings } = useSettingsCache()

// 使用API服务
const { 
  getMovieResources, 
  getTVResources,
  submitMovieResource, 
  submitTVResource,
  rateResource: apiRateResource, 
  reportResource: apiReportResource, 
  loading: apiLoading, 
  error: apiError 
} = useMoviCloudAPI()

// 资源数据
const resourceList = ref<ResourceItem[]>([])
const resourceLoading = ref(false)
const resourceError = ref('')

// 筛选状态
const filterOptions = ref({
  resourceTypes: [] as string[],
  cloudDrives: [] as string[],
  resolutions: [] as string[],
  ratingSort: 'none' as string,
  fileSizeSort: 'none' as string
})

// 筛选后的资源数据
const filteredResourceList = computed(() => {
  let list = resourceList.value
  // 类型筛选
  if (filterOptions.value.resourceTypes.length > 0) {
    list = list.filter(item => filterOptions.value.resourceTypes.includes(item.resourceType))
  }
  // 网盘筛选
  if (filterOptions.value.cloudDrives.length > 0) {
    list = list.filter(item => filterOptions.value.cloudDrives.includes(item.cloudDriveCode))
  }
  // 分辨率筛选
  if (filterOptions.value.resolutions.length > 0) {
    list = list.filter(item => filterOptions.value.resolutions.includes(item.resolution.toLowerCase()))
  }
  // 评分排序
  if (filterOptions.value.ratingSort !== 'none') {
    list = [...list].sort((a, b) => {
      const ratingA = a.rating || 0
      const ratingB = b.rating || 0
      if (filterOptions.value.ratingSort === 'rating_desc') return ratingB - ratingA
      if (filterOptions.value.ratingSort === 'rating_asc') return ratingA - ratingB
      return 0
    })
  }
  // 文件大小排序
  if (filterOptions.value.fileSizeSort !== 'none') {
    list = [...list].sort((a, b) => {
      const sizeA = parseFloat(a.fileSize)
      const sizeB = parseFloat(b.fileSize)
      if (filterOptions.value.fileSizeSort === 'size_desc') return sizeB - sizeA
      if (filterOptions.value.fileSizeSort === 'size_asc') return sizeA - sizeB
      return 0
    })
  }
  return list
})

// 筛选事件处理
const handleFilterChange = (filters: any) => {
  filterOptions.value = filters
}

// 资源类型
const resourceTypes = computed(() => [
  { id: 'original', name: t('bluray_original'), desc: t('bluray_original_desc') },
  { id: 'remux', name: t('lossless_remux'), desc: t('lossless_remux_desc') },
  { id: 'encode', name: t('high_quality_encode'), desc: t('high_quality_encode_desc') },
  { id: 'web', name: t('web_version'), desc: t('web_version_desc') }
])

// 举报原因选项
const reportReasons = computed(() => [
  { value: 'invalid_link', label: t('invalid_link') },
  { value: 'wrong_content', label: t('wrong_content') },
  { value: 'spam', label: t('spam') }
])

// 文件大小单位选项
const fileSizeUnits = [
  { value: 'MB', label: 'MB' },
  { value: 'GB', label: 'GB' }
]

// 分辨率选项
const resolutionOptions = [
  { value: '8k', label: '8K' },
  { value: '4k', label: '4K' },
  { value: '1080p', label: '1080p' },
  { value: '1080i', label: '1080i' },
  { value: '720p', label: '720p' },
  { value: 'sd', label: 'SD' }
]

// 视频编码选项
const videoCodecOptions = [
  { value: 'h264', label: 'H.264(x264/AVC)' },
  { value: 'h265', label: 'H.265(x265/HEVC)' },
  { value: 'vc1', label: 'VC-1' },
  { value: 'mpeg2', label: 'MPEG-2' },
  { value: 'xvid', label: 'Xvid' },
  { value: 'av1', label: 'AV1' },
  { value: 'vp8', label: 'VP8/9' },
  { value: 'avs', label: 'AVS' }
]

// 音频编码选项
const audioCodecOptions = [
  { value: 'aac', label: 'AAC' },
  { value: 'ac3', label: 'AC3(DD)' },
  { value: 'dts', label: 'DTS' },
  { value: 'dtshd', label: 'DTS-HD MA' },
  { value: 'eac3', label: 'E-AC3(DDP)' },
  { value: 'eac3atoms', label: 'E-AC3 Atoms(DDP Atoms)' },
  { value: 'truehd', label: 'TrueHD' },
  { value: 'truehdatoms', label: 'TrueHD Atoms' }
]

// 根据value获取label的辅助函数
const getResolutionLabel = (value: string) => {
  const option = resolutionOptions.find(opt => opt.value === value)
  return option ? option.label : value
}

const getVideoCodecLabel = (value: string) => {
  const option = videoCodecOptions.find(opt => opt.value === value)
  return option ? option.label : value
}

const getAudioCodecLabel = (value: string) => {
  const option = audioCodecOptions.find(opt => opt.value === value)
  return option ? option.label : value
}

// 获取详情数据
const fetchDetails = async () => {
  try {
    loading.value = true
    error.value = ''
    
    if (type === 'movie') {
      const [details, images] = await Promise.all([
        getMovieDetails(id),
        getMovieImages(id)
      ])
      mediaDetails.value = details
      mediaImages.value = images
      // 从详情数据中获取推荐和相似内容
      recommendations.value = details.recommendations?.results || []
      similar.value = details.similar?.results || []
      
      // 头图现在通过计算属性直接生成URL，无需异步加载
    } else {
      const [details, images] = await Promise.all([
        getTVShowDetails(id),
        getTVShowImages(id)
      ])
      mediaDetails.value = details
      mediaImages.value = images
      // 从详情数据中获取推荐和相似内容
      recommendations.value = details.recommendations?.results || []
      similar.value = details.similar?.results || []
      
      // 头图现在通过计算属性直接生成URL，无需异步加载
    }
    
    // 延迟获取资源数据：电影不在进入页面时加载，点击后再加载
    // if (type === 'movie') {
    //   await fetchResources()
    // }
    
  } catch (err) {
    error.value = '获取详情失败，请稍后重试'
  } finally {
    loading.value = false
    // 数据加载完成后检查滚动状态
    nextTick(() => {
      setTimeout(() => {
        checkScrollState()
      }, 100)
    })
  }
}

// 获取资源数据
const fetchResources = async () => {
  try {
    resourceLoading.value = true
    resourceError.value = ''
    
    if (type === 'movie') {
      const resources = await getMovieResources(id.toString())
      resourceList.value = resources
    } else {
      // 电视剧传递电视剧ID，不指定具体季数
      const resources = await getTVResources(id.toString(), id)
      resourceList.value = resources
    }
    
  } catch (err) {
    resourceError.value = '获取资源列表失败，请稍后重试'
    // API失败时不使用模拟数据，保持空列表
    resourceList.value = []
  } finally {
    resourceLoading.value = false
  }
}

// 新增：电影点击后再请求资源
const handleMovieDownload = async () => {
  try {
    resourceLoading.value = true
    resourceError.value = ''
    const resources = await getMovieResources(id.toString())
    resourceList.value = resources
    showDownloadModal.value = true
  } catch (err) {
    resourceError.value = '获取资源列表失败，请稍后重试'
    resourceList.value = []
  } finally {
    resourceLoading.value = false
  }
}

// 下载特定季数的资源
const downloadSeason = async (seasonNumber: number) => {
  try {
    resourceLoading.value = true
    resourceError.value = ''
    
    // 获取特定季数的资源
    const resources = await getTVResources(id.toString(), seasonNumber)
    resourceList.value = resources
    
    // 打开下载模态框
    showDownloadModal.value = true
    
  } catch (err) {
    resourceError.value = '获取季数资源失败，请稍后重试'
    resourceList.value = []
  } finally {
    resourceLoading.value = false
  }
}

// 下载合集（所有季数）
const downloadAllSeasons = async () => {
  try {
    resourceLoading.value = true
    resourceError.value = ''
    
    // 获取所有季数的资源
    const resources = await getTVResources(id.toString(), id)
    resourceList.value = resources
    
    // 打开下载模态框
    showDownloadModal.value = true
    
  } catch (err) {
    resourceError.value = '获取合集资源失败，请稍后重试'
    resourceList.value = []
  } finally {
    resourceLoading.value = false
  }
}

// 获取资源类型名称
const getResourceTypeName = (type: string) => {
  const typeMap: Record<string, string> = {
    'original': t('bluray_original'),
    'remux': t('lossless_remux'),
    'encode': t('high_quality_encode'),
    'web': t('web_version')
  }
  return typeMap[type] || type
}

// 页面加载时获取数据
onMounted(() => {
  fetchDetails()
})

// 计算属性
const title = computed(() => {
  if (!mediaDetails.value) return ''
  return type === 'movie' ? mediaDetails.value.title : mediaDetails.value.name
})

const score = computed(() => {
  if (!mediaDetails.value?.vote_average) return ''
  return t('score_format', { score: mediaDetails.value.vote_average.toFixed(1) })
})

const overview = computed(() => {
  return mediaDetails.value?.overview || '暂无简介'
})

// 计算属性：直接生成图片URL
const posterUrl = computed(() => {
  if (mediaDetails.value?.poster_path) {
    return `${tmdbImageBaseUrl.value}/t/p/w500${mediaDetails.value.poster_path}`
  }
  return ''
})

const backdropUrl = computed(() => {
  if (mediaDetails.value?.backdrop_path) {
    return `${tmdbImageBaseUrl.value}/t/p/w1280${mediaDetails.value.backdrop_path}`
}
  return ''
})

const releaseDate = computed(() => {
  if (!mediaDetails.value) return ''
  const date = type === 'movie' ? mediaDetails.value.release_date : mediaDetails.value.first_air_date
  const year = new Date(date).getFullYear()
  return t('year_format', { year: year.toString() })
})

const runtime = computed(() => {
  if (!mediaDetails.value) return ''
  if (type === 'movie') {
    const minutes = mediaDetails.value.runtime
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return t('duration_format', { hours: hours.toString(), minutes: mins.toString() })
  } else {
    const seasons = mediaDetails.value.number_of_seasons
    return t('seasons_format', { count: seasons.toString() })
  }
})

const genres = computed(() => {
  return mediaDetails.value?.genres?.map((g: any) => g.name) || []
})

const cast = computed(() => {
  return mediaDetails.value?.credits?.cast || []
})

const crew = computed(() => {
  return mediaDetails.value?.credits?.crew || []
})

const director = computed(() => {
  return crew.value.find((person: any) => person.job === 'Director') || null
})

const videos = computed(() => {
  return mediaDetails.value?.videos?.results || []
})

const trailer = computed(() => {
  return videos.value.find((video: any) => video.type === 'Trailer' && video.site === 'YouTube')
})

// 演员照片现在使用懒加载，无需缓存

// 跳转到人物详情页
const goToPerson = (personId: number) => {
  navigateTo(`/person/${personId}`)
}

// 打开季数详情弹窗
const openSeasonDetail = (season: any) => {
  selectedSeason.value = season
  seasonDetailVisible.value = true
  }
  
// 关闭季数详情弹窗
const closeSeasonDetail = () => {
  seasonDetailVisible.value = false
  selectedSeason.value = null
}



// 跳转到影视详情页
const goToMedia = (id: number, type: 'movie' | 'tv') => {
  navigateTo(`/${type}/${id}`)
}

// 获取导演照片URL
const getDirectorPhotoUrl = async (profilePath: string) => {
  if (!profilePath) return ''
  return await getImageUrl(profilePath, 'w185')
}

// 获取类型名称
const getGenres = (genreIds: number[]) => {
  // 这里可以从全局类型数据中获取，暂时返回空数组
  return []
}

// 季数选项
const seasonOptions = computed(() => {
  if (type === 'tv' && mediaDetails.value?.seasons) {
    const options = [
      { label: t('full_series'), value: 'all' }
    ]
    
    // 添加所有季数
    mediaDetails.value.seasons.forEach((season: any) => {
      options.push({
        label: t('season_number', { number: season.season_number }),
        value: season.season_number
      })
    })
    
    return options
  }
  return []
})

// 获取国家名称
const { getCountryName } = useCountryTranslation()
const getCountry = (language: string) => {
  return getCountryName(language)
}

// 获取年份
const getYear = (item: any) => {
  if (type === 'movie') {
    return item.release_date?.split('-')[0] || ''
  } else {
    return item.first_air_date?.split('-')[0] || ''
  }
}

// 根据屏幕宽度计算每行显示的卡片数量
const visibleCount = ref(4) // 默认显示4个

const updateVisibleCount = () => {
  const screenWidth = window.innerWidth
  
  // 根据屏幕宽度计算每行卡片数量
  let cardsPerRow = 2 // 默认每行2个
  
  if (screenWidth >= 1920) { // 3xl及以上（超宽屏）
    cardsPerRow = 12
  } else if (screenWidth >= 1600) { // 4xl（超宽屏）
    cardsPerRow = 9
  } else if (screenWidth >= 1536) { // 2xl（大屏）
    cardsPerRow = 9
  } else if (screenWidth >= 1280) { // xl
    cardsPerRow = 7
  } else if (screenWidth >= 1024) { // lg
    cardsPerRow = 5
  } else if (screenWidth >= 768) { // md
    cardsPerRow = 4
  } else if (screenWidth >= 640) { // sm
    cardsPerRow = 3
  } else { // xs
    cardsPerRow = 2
  }
  
  // 只显示一行
  visibleCount.value = cardsPerRow
}

onMounted(() => {
  updateVisibleCount()
  window.addEventListener('resize', updateVisibleCount)
})

onUnmounted(() => {
  window.removeEventListener('resize', updateVisibleCount)
})

// 滚动方法
const scrollLeft = () => {
  if (castScrollContainer.value) {
    castScrollContainer.value.scrollBy({ left: -300, behavior: 'smooth' })
    // 滚动后检查状态
    setTimeout(() => {
      checkScrollState()
    }, 350) // 等待滚动动画完成
  }
}

const scrollRight = () => {
  if (castScrollContainer.value) {
    castScrollContainer.value.scrollBy({ left: 300, behavior: 'smooth' })
    // 滚动后检查状态
    setTimeout(() => {
      checkScrollState()
    }, 350) // 等待滚动动画完成
  }
}

// 检查滚动状态
const checkScrollState = () => {
  if (castScrollContainer.value) {
    const { scrollLeft, scrollWidth, clientWidth } = castScrollContainer.value
    
    // 只要内容超出容器就显示按钮
    const hasOverflow = scrollWidth > clientWidth
    canScrollLeft.value = hasOverflow && scrollLeft > 5
    canScrollRight.value = hasOverflow && scrollLeft < scrollWidth - clientWidth - 5
  }
}

// 监听滚动事件
const handleScroll = () => {
  // 使用防抖，避免频繁检查
  clearTimeout(scrollTimeout.value)
  scrollTimeout.value = setTimeout(() => {
    checkScrollState()
  }, 100)
}

onMounted(() => {
  updateVisibleCount()
  window.addEventListener('resize', updateVisibleCount)
  
  // 延迟检查滚动状态，确保DOM已渲染
  nextTick(() => {
    setTimeout(() => {
      checkScrollState()
      if (castScrollContainer.value) {
        castScrollContainer.value.addEventListener('scroll', handleScroll)
      }
    }, 200) // 增加延迟时间确保内容完全渲染
  })
})

onUnmounted(() => {
  window.removeEventListener('resize', updateVisibleCount)
  if (castScrollContainer.value) {
    castScrollContainer.value.removeEventListener('scroll', handleScroll)
  }
})

// 打开网盘链接
const openDriveLink = (link: string) => {
  if (link) {
    window.open(link, '_blank')
  }
}

// 复制网盘链接
const copyDriveLink = async (link: string) => {
  if (link && navigator.clipboard) {
    try {
      await navigator.clipboard.writeText(link)
      toast.add({ 
        severity: 'success', 
        summary: '成功', 
        detail: '链接已复制到剪贴板', 
        life: 2000 
      });
    } catch (err) {
      console.error('复制失败:', err)
      toast.add({ 
        severity: 'error', 
        summary: '错误', 
        detail: '复制失败，请稍后重试', 
        life: 3000 
      });
    }
  }
}

// 评分资源
const rateResource = (resourceId: string) => {
  ratingDriveName.value = resourceId
  currentRating.value = 0
  ratingComment.value = ''
  showRateModal.value = true
}

// 提交评分
const submitRating = async () => {
  try {
    if (currentRating.value === 0) {
      toast.add({ 
        severity: 'warn', 
        summary: '提示', 
        detail: '请选择评分', 
        life: 3000 
      });
      return
    }
    
    // 调用API提交评分
    const resourceId = parseInt(ratingDriveName.value)
    const result = await apiRateResource(resourceId, currentRating.value, ratingComment.value)
    
    // 更新本地资源数据
    const resource = resourceList.value.find(r => r.id === resourceId)
    if (resource) {
      resource.rating = result.rating
      resource.ratingCount = result.ratingCount
    }
    
    // 提交成功后关闭模态框
    showRateModal.value = false
    
    // 重置表单
    currentRating.value = 0
    ratingComment.value = ''
    ratingDriveName.value = ''
    
    // 提交成功提示
    toast.add({ 
      severity: 'success', 
      summary: '成功', 
      detail: '评分提交成功！', 
      life: 3000 
    });
  } catch (error) {
    console.error('提交评分失败:', error)
    toast.add({ 
      severity: 'error', 
      summary: '错误', 
      detail: apiError.value || '提交失败，请稍后重试', 
      life: 3000 
    });
  }
}

// 举报资源
const reportResource = (resourceId: string) => {
  reportDriveName.value = resourceId
  reportReason.value = ''
  reportComment.value = ''
  showReportModal.value = true
}

// 提交举报
const submitReport = async () => {
  try {
    if (!reportReason.value) {
      toast.add({ 
        severity: 'warn', 
        summary: '提示', 
        detail: '请选择举报原因', 
        life: 3000 
      });
      return
    }
    
    // 调用API提交举报
    const resourceId = parseInt(reportDriveName.value)
    const result = await apiReportResource(resourceId, reportReason.value, reportComment.value)
    
    // 提交成功后关闭模态框
    showReportModal.value = false
    
    // 重置表单
    reportReason.value = ''
    reportComment.value = ''
    reportDriveName.value = ''
    
    // 提交成功提示
    toast.add({ 
      severity: 'success', 
      summary: '成功', 
      detail: '举报提交成功！', 
      life: 3000 
    });
  } catch (error) {
    console.error('提交举报失败:', error)
    toast.add({ 
      severity: 'error', 
      summary: '错误', 
      detail: apiError.value || '提交失败，请稍后重试', 
      life: 3000 
    });
  }
}

// 获取toast实例
const toast = useToast();

// 提交资源
const submitResource = async () => {
  try {
    // 验证表单
    if (!submitForm.value.driveName) {
      toast.add({ 
        severity: 'warn', 
        summary: '提示', 
        detail: '请选择网盘', 
        life: 3000 
      });
      return
    }
    if (!submitForm.value.link) {
      toast.add({ 
        severity: 'warn', 
        summary: '提示', 
        detail: '请输入资源链接', 
        life: 3000 
      });
      return
    }
    if (!submitForm.value.fileSize) {
      toast.add({ 
        severity: 'warn', 
        summary: '提示', 
        detail: '请输入文件大小', 
        life: 3000 
      });
      return
    }
    if (!submitForm.value.resolution) {
      toast.add({ 
        severity: 'warn', 
        summary: '提示', 
        detail: '请选择分辨率', 
        life: 3000 
      });
      return
    }
    if (!submitForm.value.videoCodec) {
      toast.add({ 
        severity: 'warn', 
        summary: '提示', 
        detail: '请选择视频编码', 
        life: 3000 
      });
      return
    }
    if (!submitForm.value.audioCodec) {
      toast.add({ 
        severity: 'warn', 
        summary: '提示', 
        detail: '请选择音频编码', 
        life: 3000 
      });
      return
    }
    
    // 调用API提交资源
    const resourceData = {
      mediaId: id,
      resourceType: submitForm.value.resourceType,
      cloudDriveCode: submitForm.value.driveName,
      driveLink: submitForm.value.link,
      resolution: submitForm.value.resolution,
      fileSize: `${submitForm.value.fileSize}${submitForm.value.fileSizeUnit}`,
      videoCodec: submitForm.value.videoCodec,
      audioCodec: submitForm.value.audioCodec
    }
    
    let result
    if (type === 'movie') {
      result = await submitMovieResource(resourceData)
    } else {
      // 电视剧需要添加季数信息
      const tvResourceData = {
        ...resourceData,
        seasonNumber: submitForm.value.season === 'all' ? id : parseInt(submitForm.value.season || '1')
      }
      result = await submitTVResource(tvResourceData)
    }
    
    // 提交成功后关闭模态框
    showSubmitModal.value = false
    
    // 重置表单
    submitForm.value = {
      resourceType: 'original',
      driveName: '',
      link: '',
      season: type === 'tv' ? 'all' : null,
      fileSize: '',
      fileSizeUnit: 'GB',
      resolution: '',
      videoCodec: '',
      audioCodec: ''
    }
    
    // 提交成功提示
    toast.add({ 
      severity: 'success', 
      summary: '成功', 
      detail: '资源提交成功！等待审核通过后即可显示。', 
      life: 3000 
    });
  } catch (error) {
    console.error('提交资源失败:', error)
    toast.add({ 
      severity: 'error', 
      summary: '错误', 
      detail: apiError.value || '提交失败，请稍后重试', 
      life: 3000 
    });
  }
}

// Logo URL
const logoUrl = ref('')
const logoError = ref(false)

// 加载logo URL
const loadLogoUrl = async () => {
  if (mediaImages.value?.logos && mediaImages.value.logos.length > 0) {
    try {
      logoError.value = false
      logoUrl.value = await getImageUrl(mediaImages.value.logos[0].file_path, 'original')
    } catch (error) {
      console.error('加载logo失败:', error)
      logoError.value = true
      logoUrl.value = ''
    }
  }
}

// 监听媒体图片变化
watch(() => mediaImages.value, () => {
  loadLogoUrl()
}, { deep: true })


</script>

<template>
  <div class="bg-surface-50 dark:bg-surface-950">
    <!-- 加载状态 -->
    <div v-if="loading" class="min-h-screen flex items-center justify-center">
      <div class="text-center">
        <i class="pi pi-spin pi-spinner text-4xl text-primary mb-4"></i>
        <p class="text-surface-600 dark:text-surface-400">{{ t('loading') }}</p>
      </div>
    </div>
    
    <!-- 错误状态 -->
    <div v-else-if="error" class="min-h-screen flex items-center justify-center">
      <div class="text-center">
        <i class="pi pi-exclamation-triangle text-4xl text-red-500 mb-4"></i>
        <p class="text-surface-600 dark:text-surface-400 mb-4">{{ error }}</p>
        <button 
          @click="fetchDetails"
          class="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-600 transition-colors duration-200"
        >
          {{ t('retry') }}
        </button>
      </div>
    </div>
    
    <!-- 详情内容 -->
    <div v-else-if="mediaDetails" class="min-h-screen">
      <!-- 背景图片 -->
      <div class="relative h-[500px] 2xl:h-[700px]">
        <!-- 头图 -->
        <img 
          v-if="backdropUrl"
          :src="backdropUrl" 
          :alt="title"
          class="w-full h-full object-cover"
        />
        
        <!-- 无头图时的占位 -->
        <div 
          v-else
          class="w-full h-full bg-gradient-to-br from-gray-300 to-gray-400 dark:from-gray-700 dark:to-gray-800"
        ></div>
        
        <div class="absolute inset-0 bg-gradient-to-b from-transparent via-surface-50/50 to-surface-50 dark:via-surface-950/50 dark:to-surface-950"></div>
        
        <!-- 主要内容 -->
        <div class="absolute bottom-0 left-0 right-0 z-10 p-6">
          <div class="mx-auto">
            <!-- 标题和基本信息 -->
            <div class="mb-6">
              <h1 class="text-5xl 2xl:text-7xl font-bold text-gray-900 dark:text-white mb-4">{{ title }}</h1>
              
              <!-- 基本信息行 -->
              <div class="flex items-center gap-4 text-gray-900/90 dark:text-white/90 text-sm mb-4">
                <!-- 评分 -->
                <div class="flex items-center gap-2 bg-gray-900/20 dark:bg-white/10 px-3 py-1.5 rounded-full border border-gray-900/30 dark:border-white/30">
                  <i class="pi pi-star text-yellow-500 text-sm"></i>
                  <span class="font-bold text-gray-900 dark:text-white">{{ score }}</span>
                </div>
                
                <!-- 年份 -->
                <div class="flex items-center gap-2 bg-gray-900/20 dark:bg-white/10 px-3 py-1.5 rounded-full border border-gray-900/30 dark:border-white/30">
                  <i class="pi pi-calendar text-gray-900 dark:text-white text-sm"></i>
                  <span class="font-semibold text-gray-900 dark:text-white">{{ releaseDate }}</span>
                </div>
                
                <!-- 类型 -->
                <div class="flex items-center gap-2 bg-gray-900/20 dark:bg-white/10 px-3 py-1.5 rounded-full border border-gray-900/30 dark:border-white/30">
                  <i class="pi pi-tag text-gray-900 dark:text-white text-sm"></i>
                  <span class="font-semibold text-gray-900 dark:text-white">{{ type === 'movie' ? t('movie') : t('tv_show') }}</span>
                </div>
                
                <!-- 时长 -->
                <div class="flex items-center gap-2 bg-gray-900/20 dark:bg-white/10 px-3 py-1.5 rounded-full border border-gray-900/30 dark:border-white/30">
                  <i class="pi pi-clock text-gray-900 dark:text-white text-sm"></i>
                  <span class="font-semibold text-gray-900 dark:text-white">{{ runtime }}</span>
                </div>
                
                <!-- 类型标签 -->
                <div class="flex items-center gap-2">
                  <span 
                    v-for="genre in genres.slice(0, 2)" 
                    :key="genre"
                    class="px-2 py-1 bg-gray-900/20 dark:bg-white/10 text-gray-900 dark:text-white text-xs rounded-md border border-gray-900/30 dark:border-white/30"
                  >
                    {{ genre }}
                  </span>
                  <span v-if="genres.length > 2" class="text-gray-900/70 dark:text-white/70 text-xs">+{{ genres.length - 2 }}</span>
                </div>
              </div>
            </div>
            
            <!-- 操作按钮 -->
            <div class="flex items-center gap-4 mb-8">
              <button 
                @click="type === 'tv' ? downloadAllSeasons() : handleMovieDownload()"
                class="flex items-center gap-3 px-8 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
              >
                <i class="pi pi-download text-lg"></i>
                <span class="font-semibold">{{ type === 'tv' ? t('download_all_episodes') : t('download_save') }}</span>
              </button>
              
              <button 
                @click="showSubmitModal = true"
                class="flex items-center gap-3 px-6 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
              >
                <i class="pi pi-plus text-lg"></i>
                <span class="font-semibold">{{ t('submit_resource') }}</span>
              </button>
              
              <button class="flex items-center justify-center w-12 h-12 bg-gray-900/20 dark:bg-white/20 text-gray-900 dark:text-white rounded-full hover:bg-gray-900/30 dark:hover:bg-white/30 transition-colors">
                <i class="pi pi-star text-lg"></i>
              </button>
              
              <button class="flex items-center justify-center w-12 h-12 bg-gray-900/20 dark:bg-white/20 text-gray-900 dark:text-white rounded-full hover:bg-gray-900/30 dark:hover:bg-white/30 transition-colors">
                <i class="pi pi-ellipsis-h text-lg"></i>
              </button>
            </div>
            
            <!-- 简介 -->
            <div>
              <p class="text-gray-900/90 dark:text-white/90 leading-relaxed max-w-3xl line-clamp-3">{{ overview }}</p>
            </div>
            
            <div v-if="mediaImages && mediaImages.logos && mediaImages.logos.length > 0 && logoUrl && !logoError" class="absolute bottom-10 right-10 z-20">
              <img
                :src="logoUrl"
                class="max-w-120 max-h-120 w-auto h-auto object-contain drop-shadow-2xl"
                @error="(event) => { const target = event.target as HTMLImageElement; target.src = ''; logoError = true }"
              />
            </div>
          </div>
        </div>
      </div>
      <!-- 演职人员 -->
      <div class="p-6">
        <h3 class="text-2xl font-semibold text-gray-900 dark:text-white mb-4">{{ t('cast_and_crew') }}</h3>
        <div class="relative">
          <!-- 滚动容器 -->
          <div 
            ref="castScrollContainer"
            class="flex gap-8 overflow-x-auto pb-4 scrollbar-hide"
            style="scroll-behavior: smooth;"
          >
            <!-- 懒加载观察器容器 -->
          <div 
            v-for="person in cast" 
            :key="person.id"
            class="flex-shrink-0 text-center cursor-pointer hover:scale-105 transition-transform"
            @click="goToPerson(person.id)"
          >
              <div class="mx-auto w-20 h-20 rounded-full mb-2 overflow-hidden relative">
                <ImageLazy
                  v-if="person.profile_path"
                  :src="`${tmdbImageBaseUrl}/t/p/w185${person.profile_path}`"
                :alt="person.name"
                  img-class="absolute inset-0 w-full h-full object-cover rounded-full"
                  priority="low"
                  root-margin="100px"
                  default-icon="user"
              />
              
              <!-- 没有头像时的默认图标 -->
              <i v-if="!person.profile_path" class="pi pi-user text-white text-xl"></i>
            </div>
            <p class="text-gray-900 dark:text-white text-sm font-medium truncate max-w-20">{{ person.name }}</p>
            <p class="text-gray-600 dark:text-white/60 text-xs truncate max-w-20">{{ t('played_by') }} {{ person.character || t('unknown_role') }}</p>
          </div>
            <!-- 导演 -->
            <div v-if="director" class="flex-shrink-0 text-center cursor-pointer hover:scale-105 transition-transform" @click="goToPerson(director.id)">
              <div class="w-20 h-20 bg-gray-300 dark:bg-gray-600 rounded-full mb-2 flex items-center justify-center overflow-hidden relative">
                <ImageLazy
                  v-if="director.profile_path"
                  :src="`${tmdbImageBaseUrl}/t/p/w185${director.profile_path}`"
                  :alt="director.name"
                  img-class="absolute inset-0 w-full h-full object-cover rounded-full"
                  priority="high"
                  root-margin="50px"
                  default-icon="user"
                />
                
                <!-- 没有头像时的默认图标 -->
                <i v-if="!director.profile_path" class="pi pi-user text-white text-xl"></i>
              </div>
              <p class="text-gray-900 dark:text-white text-sm font-medium truncate max-w-20">{{ director.name }}</p>
              <p class="text-gray-600 dark:text-white/60 text-xs">{{ t('director') }}</p>
          </div>
          </div>
          
          <!-- 左滚动按钮 -->
          <button 
            v-if="canScrollLeft"
            @click="scrollLeft"
            class="absolute left-0 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center transition-all duration-200 z-10"
          >
            <i class="pi pi-chevron-left text-lg"></i>
          </button>
          
          <!-- 右滚动按钮 -->
          <button 
            v-if="canScrollRight"
            @click="scrollRight"
            class="absolute right-0 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center transition-all duration-200 z-10"
          >
            <i class="pi pi-chevron-right text-lg"></i>
          </button>
        </div>
      </div>

      <!-- 电视剧季数信息 -->
      <div v-if="type === 'tv' && mediaDetails?.seasons" class="px-6 py-8">
        <h3 class="text-2xl font-semibold text-gray-900 dark:text-white mb-6">{{ t('episode_info') }}</h3>
        
                <!-- 季数卡片网格 -->
        <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7 2xl:grid-cols-9 gap-4">
          <div 
            v-for="season in mediaDetails.seasons" 
            :key="season.season_number"
            class="group cursor-pointer"
            @click="openSeasonDetail(season)"
          >
            <!-- 季数海报卡片 -->
            <div class="relative aspect-[2/3] w-full rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 hover:scale-105">
              <img
                v-if="season.poster_path"
                :src="`${tmdbImageBaseUrl}/t/p/w500${season.poster_path}`"
                :alt="`${title} ${t('season')} ${season.season_number}`"
                class="absolute inset-0 w-full h-full object-cover"
              />
              <div v-else class="absolute inset-0 bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                <i class="pi pi-image text-gray-400 dark:text-gray-500 text-2xl"></i>
              </div>
              
              <!-- 悬停时的渐变遮罩 -->
              <div class="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            
              <!-- 季数信息覆盖层 -->
              <div class="absolute bottom-0 left-0 right-0 p-3 text-white transform translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                <h4 class="font-semibold text-sm mb-1 line-clamp-1">
                  {{ season.name || `${title} ${t('season')} ${season.season_number}` }}
                </h4>
                <div class="flex items-center gap-2 text-xs opacity-90">
                  <i class="pi pi-calendar"></i>
                  <span>{{ season.air_date ? new Date(season.air_date).getFullYear() : t('unknown') }}</span>
                </div>
              </div>
            </div>
            
            <!-- 季数标题 -->
            <div class="mt-2 text-center">
              <h4 class="text-sm font-medium text-gray-900 dark:text-white line-clamp-1">
                {{ season.name || t('season_number', { number: season.season_number }) }}
              </h4>
              <p class="text-xs text-gray-600 dark:text-gray-400 mt-1">
                {{ season.episode_count || 0 }} {{ t('episodes') }}
              </p>
            </div>
          </div>
        </div>
              </div>
              
              <!-- 季数详情弹窗 -->
        <Dialog
          v-model:visible="seasonDetailVisible"
          maximizable modal :header="`《${title}》${t('season_number', { number: selectedSeason?.season_number || 0 })} - ${selectedSeason?.name || ''}`"
          class="md:w-300 w-9/10"
          pt:mask="backdrop-blur-sm"
          :contentStyle="isMaximized ? { height: 'calc(100vh - 120px)', overflowY: 'auto' } : { maxHeight: '70vh', overflowY: 'auto' }"
          @maximize="isMaximized = true"
          @unmaximize="isMaximized = false"
        >
        <!-- 季数信息头部 -->
        <div class="sticky top-0 z-10 bg-gray-200 dark:bg-gray-900 rounded-lg p-4">
          <div class="flex items-center gap-4">
            <div class="w-16 h-24 rounded-lg overflow-hidden flex-shrink-0">
              <img
                v-if="selectedSeason?.poster_path"
                :src="`${tmdbImageBaseUrl}/t/p/w500${selectedSeason.poster_path}`"
                :alt="`${title} ${t('season')} ${selectedSeason?.season_number}`"
                class="w-full h-full object-cover"
              />
              <div v-else class="w-full h-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                <i class="pi pi-image text-gray-400 dark:text-gray-500"></i>
                </div>
            </div>
            <div class="flex-1 min-w-0">
              <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                {{ selectedSeason?.name || t('season_number', { number: selectedSeason?.season_number || 0 }) }}
              </h3>
              <div class="grid grid-cols-2 gap-4 text-sm text-gray-600 dark:text-gray-400">
                <div class="flex items-center gap-2">
                  <i class="pi pi-video text-primary-500"></i>
                  <span>{{ selectedSeason?.episode_count || 0 }} {{ t('episodes') }}</span>
                </div>
                <div v-if="selectedSeason?.air_date" class="flex items-center gap-2">
                  <i class="pi pi-calendar text-primary-500"></i>
                  <span>{{ new Date(selectedSeason.air_date).getFullYear() }}</span>
                </div>
                <div v-if="selectedSeason?.episode_run_time && selectedSeason.episode_run_time.length > 0" class="flex items-center gap-2">
                  <i class="pi pi-clock text-primary-500"></i>
                  <span>{{ selectedSeason.episode_run_time[0] }} {{ t('minutes') }}</span>
                </div>
              </div>
            </div>
                </div>
              </div>
              
        <!-- 季数详情内容 -->
        <div class="mt-6 space-y-6">
              <!-- 简介 -->
          <div>
            <h4 class="font-semibold text-gray-900 dark:text-white mb-3 text-base">{{ t('overview') }}</h4>
            <p v-if="selectedSeason?.overview" class="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
              {{ selectedSeason.overview }}
              </p>
            <p v-else class="text-sm text-gray-500 dark:text-gray-500 italic">
                {{ t('no_description') }}
              </p>
        </div>
        
          <!-- 下载操作 -->
          <div class="border-t pt-6">
            <h4 class="font-semibold text-gray-900 dark:text-white mb-4 text-base">{{ t('download_operations') }}</h4>
            <div class="flex gap-4">
          <button
                @click="downloadSeason(selectedSeason?.season_number)"
                class="flex-1 flex items-center justify-center gap-3 px-6 py-3 bg-primary-500 hover:bg-primary-600 dark:bg-primary-600 dark:hover:bg-primary-700 text-white rounded-lg transition-colors duration-200 shadow-md hover:shadow-lg"
              >
                <i class="pi pi-download text-lg"></i>
                <span class="font-medium">{{ t('download_save') }}</span>
          </button>
        </div>
      </div>
        </div>
      </Dialog>

      <!-- 推荐内容 -->
      <div class="px-6 py-8">
        <div class="mx-auto space-y-8">
          <!-- 推荐列表 -->
          <div v-if="recommendations.length > 0">
            <div class="flex items-center justify-between mb-6">
              <h3 class="text-2xl font-bold text-surface-900 dark:text-surface-0">{{ t('recommendations') }}</h3>
            </div>
            <ResponsiveGrid class="responsive-grid">
              <MediaCard
                v-for="item in recommendations.slice(0, visibleCount)"
                :key="item.id"
                :id="item.id"
                :title="type === 'movie' ? item.title : item.name"
                :poster-path="item.poster_path"
                :rating="item.vote_average"
                :vote-count="item.vote_count"
                :genres="getGenres(item.genre_ids)"
                :country="getCountry(item.original_language)"
                :year="getYear(item)"
                :cast="[]"
                :type="type"
                @click="goToMedia"
              />
            </ResponsiveGrid>
          </div>

          <!-- 相似内容 -->
          <div v-if="similar.length > 0">
            <div class="flex items-center justify-between mb-6">
              <h3 class="text-2xl font-bold text-surface-900 dark:text-surface-0">{{ t('similar_content') }}</h3>
            </div>
            <ResponsiveGrid class="responsive-grid">
              <MediaCard
                v-for="item in similar.slice(0, visibleCount)"
                :key="item.id"
                :id="item.id"
                :title="type === 'movie' ? item.title : item.name"
                :poster-path="item.poster_path"
                :rating="item.vote_average"
                :vote-count="item.vote_count"
                :genres="getGenres(item.genre_ids)"
                :country="getCountry(item.original_language)"
                :year="getYear(item)"
                :cast="[]"
                :type="type"
                @click="goToMedia"
              />
            </ResponsiveGrid>
          </div>
                </div>
      </div>
    </div>
  </div>

  <!-- 下载/转存弹窗 -->
  <Dialog
    v-model:visible="showDownloadModal"
    maximizable modal :header="`《` + title + `》${t('download_save')}`"
    class="md:w-300 w-9/10"
    pt:mask="backdrop-blur-sm"
    :contentStyle="isMaximized ? { height: 'calc(100vh - 120px)', overflowY: 'auto' } : { maxHeight: '70vh', overflowY: 'auto' }"
    @maximize="isMaximized = true"
    @unmaximize="isMaximized = false"
  >
    <!-- 筛选组件 - 固定在顶部 -->
    <div class="sticky top-0 z-10 bg-gray-200 dark:bg-gray-900 rounded-lg">
      <CloudDriveFilter @filter-change="handleFilterChange" />
    </div>
    
    <!-- 资源列表 -->
    <div v-if="filteredResourceList.length > 0" class="mt-6">
      <div class="space-y-4">
        <Card
          v-for="resource in filteredResourceList"
          :key="resource.id"
          class="group hover:shadow-xl transition-all duration-300 cursor-pointer border-2 border-transparent hover:border-primary-200 dark:hover:border-primary-800"
          :pt="{
            root: 'bg-gray-200 dark:bg-gray-800 shadow-lg rounded-xl',
            body: 'p-6'
          }"
        >
          <template #content>
            <div class="flex items-center justify-between gap-4 lg:gap-6">
              <!-- 左侧：网盘信息和评分 -->
              <div class="flex items-center gap-4 lg:gap-6 flex-shrink-0">
                <!-- 网盘图标和名称 -->
                <div class="flex items-center gap-3 lg:gap-4">
                  <div class="w-12 h-12 lg:w-16 lg:h-16 rounded-2xl overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 flex items-center justify-center shadow-lg flex-shrink-0">
                    <img
                      :src="getDriveById(resource.cloudDriveCode)?.logo"
                      :alt="getDriveById(resource.cloudDriveCode)?.name"
                      class="w-8 h-8 lg:w-12 lg:h-12 rounded-xl"
                      @error="(event) => { const target = event.target as HTMLImageElement; target.src = '' }"
                    />
                  </div>
                  <div class="min-w-0">
                    <h4 class="font-bold text-gray-900 dark:text-white text-base lg:text-xl group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors duration-300 truncate">
                        {{ getDriveById(resource.cloudDriveCode)?.name }}
                      </h4>
                    <span class="inline-block text-xs text-gray-400 dark:text-gray-500 mt-1 truncate">{{ getResourceTypeName(resource.resourceType) }}</span>
                  </div>
                </div>
              </div>
              <!-- 中间：文件信息 -->
              <div class="flex items-center gap-4 lg:gap-6">
                <div class="text-center min-w-0 flex-shrink-0">
                  <div class="flex items-center gap-1">
                    <i class="pi pi-star-fill text-yellow-400 text-lg lg:text-xl"></i>
                      <span class="text-base lg:text-lg font-bold text-gray-900 dark:text-white">{{ (resource.rating || 0).toFixed(1) }}</span>
                  </div>
                  <div class="text-xs text-gray-500 dark:text-gray-400">{{ t('rating_count_format', { count: (resource.ratingCount || 0).toString() }) }}</div>
                </div>
                <div class="text-center min-w-0 flex-shrink-0">
                  <div class="text-lg lg:text-xl font-bold text-gray-900 dark:text-white truncate">{{ resource.fileSize }}</div>
                  <div class="text-xs text-gray-500 dark:text-gray-400">{{ t('file_size') }}</div>
                </div>
                <div class="text-center min-w-0 flex-shrink-0">
                  <div class="text-base lg:text-lg font-semibold text-gray-900 dark:text-white truncate">{{ getResolutionLabel(resource.resolution) }}</div>
                  <div class="text-xs text-gray-500 dark:text-gray-400">{{ t('resolution') }}</div>
                </div>
                <div class="text-center min-w-0 flex-shrink-0">
                  <div class="text-base lg:text-lg font-medium text-gray-900 dark:text-white truncate" :title="getVideoCodecLabel(resource.videoCodec)">{{ getVideoCodecLabel(resource.videoCodec) }}</div>
                  <div class="text-xs text-gray-500 dark:text-gray-400">{{ t('video_codec') }}</div>
                </div>
                <div class="text-center min-w-0 flex-shrink-0">
                  <div class="text-base lg:text-lg font-medium text-gray-900 dark:text-white truncate" :title="getAudioCodecLabel(resource.audioCodec)">{{ getAudioCodecLabel(resource.audioCodec) }}</div>
                  <div class="text-xs text-gray-500 dark:text-gray-400">{{ t('audio_codec') }}</div>
                </div>
              </div>
              <!-- 右侧：操作按钮 -->
              <div class="flex items-center gap-2 lg:gap-3 flex-shrink-0">
                <button
                  @click="openDriveLink(resource.driveLink)"
                  class="w-10 h-10 lg:w-12 lg:h-12 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white rounded-xl transition-all duration-300 flex items-center justify-center shadow-lg hover:shadow-xl transform hover:scale-110"
                  :title="t('open_link')"
                >
                  <i class="pi pi-external-link text-base lg:text-lg"></i>
                </button>
                <button
                  @click="copyDriveLink(resource.driveLink)"
                  class="w-10 h-10 lg:w-12 lg:h-12 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-xl transition-all duration-300 flex items-center justify-center shadow-lg hover:shadow-xl transform hover:scale-110"
                  :title="t('copy_link')"
                >
                  <i class="pi pi-copy text-base lg:text-lg"></i>
                </button>
                <button
                  @click="rateResource(resource.id.toString())"
                  class="w-10 h-10 lg:w-12 lg:h-12 bg-green-100 hover:bg-green-200 dark:bg-green-700/20 dark:hover:bg-green-700/30 text-green-600 dark:text-green-400 rounded-xl transition-all duration-300 flex items-center justify-center shadow-lg hover:shadow-xl transform hover:scale-110"
                  :title="t('rate')"
                >
                  <i class="pi pi-star text-base lg:text-lg"></i>
                </button>
                <button
                  @click="reportResource(resource.id.toString())"
                  class="w-10 h-10 lg:w-12 lg:h-12 bg-red-100 hover:bg-red-200 dark:bg-red-700/20 dark:hover:bg-red-700/30 text-red-600 dark:text-red-400 rounded-xl transition-all duration-300 flex items-center justify-center shadow-lg hover:shadow-xl transform hover:scale-110"
                  :title="t('report')"
                >
                  <i class="pi pi-flag text-base lg:text-lg"></i>
                </button>
              </div>
            </div>
          </template>
        </Card>
      </div>
    </div>
    
    <!-- 加载状态 -->
    <div v-else-if="resourceLoading" class="flex items-center justify-center py-12">
      <div class="text-center">
        <i class="pi pi-spin pi-spinner text-4xl text-primary mb-4"></i>
        <p class="text-surface-600 dark:text-surface-400">{{ t('loading') }}</p>
      </div>
    </div>
    
    <!-- 加载失败状态 -->
    <div v-else-if="resourceError" class="flex items-center justify-center py-12">
      <div class="text-center">
        <i class="pi pi-exclamation-triangle text-4xl text-red-500 mb-4"></i>
        <p class="text-surface-600 dark:text-surface-400 mb-4">{{ resourceError }}</p>
        <button 
          @click="fetchResources"
          class="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-600 transition-colors duration-200"
        >
          {{ t('retry') }}
        </button>
      </div>
    </div>
    
    <!-- 无数据状态 -->
    <div v-else-if="resourceList.length === 0" class="flex items-center justify-center py-12">
      <div class="text-center">
        <i class="pi pi-inbox text-4xl text-gray-400 mb-4"></i>
        <p class="text-surface-600 dark:text-surface-400 mb-2">{{ t('no_resources_available') }}</p>
        <p class="text-surface-500 dark:text-surface-500 text-sm">{{ t('be_first_to_submit') }}</p>
      </div>
    </div>
    
    <!-- 无筛选结果 -->
    <div v-else class="flex items-center justify-center py-12">
      <div class="text-center">
        <i class="pi pi-search text-4xl text-gray-400 mb-4"></i>
        <p class="text-surface-600 dark:text-surface-400">{{ t('no_results_found') }}</p>
      </div>
    </div>
  </Dialog>

  <!-- 评分模态框 -->
  <Dialog 
    v-model:visible="showRateModal" 
    modal :header="`${t('rate_resource')} ${ratingDriveName}`"
    class="md:w-96 w-9/10"
    pt:mask="backdrop-blur-sm"
  >
    <div class="space-y-6">
      <!-- 星级评分 -->
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">{{ t('rating') }}</label>
        <div class="flex items-center gap-2">
          <button
            v-for="star in 5"
            :key="star"
            @click="currentRating = star"
            :class="[
              'text-2xl transition-all duration-200',
              star <= currentRating
                ? 'text-yellow-400 hover:text-yellow-500'
                : 'text-gray-300 dark:text-gray-600 hover:text-yellow-400'
            ]"
          >
            <i class="pi pi-star-fill"></i>
          </button>
          <span class="ml-3 text-sm text-gray-600 dark:text-gray-400">
            {{ currentRating }}/5 {{ t('stars') }}
          </span>
        </div>
      </div>

      <!-- 评价内容 -->
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{{ t('comment_optional') }}</label>
        <InputText
          v-model="ratingComment"
          :placeholder="t('please_share_your_experience')"
          class="w-full"
        />
      </div>
    </div>

    <template #footer>
      <div class="flex gap-4">
        <button
          @click="showRateModal = false"
          class="px-6 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors duration-200"
        >
          {{ t('cancel') }}
        </button>
        <button
          @click="submitRating"
          class="px-6 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors duration-200"
        >
          {{ t('submit_rating') }}
        </button>
      </div>
    </template>
  </Dialog>

  <!-- 举报模态框 -->
  <Dialog 
    v-model:visible="showReportModal" 
    modal :header="`${t('report_resource')} ${reportDriveName}`"
    class="md:w-96 w-9/10"
    pt:mask="backdrop-blur-sm"
  >
    <div class="space-y-6">
      <!-- 举报原因 -->
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">{{ t('report_reason') }}</label>
        <SelectButton 
          v-model="reportReason" 
          :options="reportReasons" 
          optionLabel="label" 
          optionValue="value"
          class="w-full"
        />
      </div>

      <!-- 详细说明 -->
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{{ t('detailed_description_optional') }}</label>
        <InputText
          v-model="reportComment"
          :placeholder="t('please_describe_the_problem_in_detail')"
          class="w-full"
        />
      </div>
    </div>

    <template #footer>
      <div class="flex gap-4">
        <button
          @click="showReportModal = false"
          class="px-6 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors duration-200"
        >
          {{ t('cancel') }}
        </button>
        <button
          @click="submitReport"
          class="px-6 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors duration-200"
        >
          {{ t('submit_report') }}
        </button>
      </div>
    </template>
  </Dialog>

  <!-- 提交资源模态框 -->
  <Dialog 
    v-model:visible="showSubmitModal" 
    maximizable modal :header="`《` + title + `》${t('submit_resource')}`"
    class="md:w-300 w-9/10"
    pt:mask="backdrop-blur-sm"
  >

    <!-- 提交表单 -->
    <div class="space-y-6">
      <!-- 资源类型选择 -->
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">{{ t('resource_type') }}</label>
        <SelectButton 
          v-model="submitForm.resourceType" 
          :options="resourceTypes" 
          optionLabel="name" 
          optionValue="id"
          class="w-full"
        />
      </div>

      <!-- 网盘选择 -->
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">{{ t('select_cloud_drive') }}</label>
        <SelectButton 
          v-model="submitForm.driveName" 
          :options="cloudDrives" 
          optionLabel="name" 
          optionValue="code"
          class="w-full"
        />
        <!-- 显示选中的网盘信息 -->
        <div v-if="submitForm.driveName" class="mt-3 flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <img 
            :src="getDriveById(submitForm.driveName)?.logo" 
            :alt="getDriveById(submitForm.driveName)?.name"
            class="w-8 h-8 rounded-lg"
            @error="(event) => { const target = event.target as HTMLImageElement; target.src = '' }"
          />
          <div>
            <div class="font-medium text-gray-900 dark:text-white">{{ getDriveById(submitForm.driveName)?.name }}</div>
            <div class="text-sm text-gray-500 dark:text-gray-400">{{ t('selected_drive') }}</div>
          </div>
        </div>
      </div>

      <!-- 电视剧季数选择 -->
      <div v-if="type === 'tv' && mediaDetails?.seasons">
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">{{ t('select_season') }}</label>
        <SelectButton 
          v-model="submitForm.season" 
          :options="seasonOptions" 
          optionLabel="label" 
          optionValue="value"
          class="w-full"
        />
      </div>

      <!-- 资源链接 -->
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{{ t('resource_link') }}</label>
        <InputText
          v-model="submitForm.link"
          type="url"
          :placeholder="t('please_enter_resource_link')"
          class="w-full"
        />
      </div>

      <!-- 文件大小 -->
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{{ t('file_size') }}</label>
          <InputText
            v-model="submitForm.fileSize"
            type="number"
            :placeholder="t('please_enter_file_size')"
            class="w-full"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{{ t('unit') }}</label>
          <SelectButton 
            v-model="submitForm.fileSizeUnit" 
            :options="fileSizeUnits" 
            optionLabel="label" 
            optionValue="value"
            class="w-full"
          />
        </div>
      </div>

      <!-- 分辨率 -->
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">{{ t('resolution') }}</label>
        <SelectButton 
          v-model="submitForm.resolution" 
          :options="resolutionOptions" 
          optionLabel="label" 
          optionValue="value"
          class="w-full"
        />
      </div>

      <!-- 视频编码 -->
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">{{ t('video_codec') }}</label>
        <SelectButton 
          v-model="submitForm.videoCodec" 
          :options="videoCodecOptions" 
          optionLabel="label" 
          optionValue="value"
          class="w-full"
        />
      </div>

      <!-- 音频编码 -->
      <div>
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">{{ t('audio_codec') }}</label>
        <SelectButton 
          v-model="submitForm.audioCodec" 
          :options="audioCodecOptions" 
          optionLabel="label" 
          optionValue="value"
          class="w-full"
        />
      </div>
    </div>

    <template #footer>
      <div class="flex gap-4">
        <button
          @click="submitResource"
          class="flex-1 px-6 py-3 bg-primary-500 hover:bg-primary-600 text-white font-semibold rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
        >
          <i class="pi pi-check text-lg"></i>
          {{ t('submit_resource') }}
        </button>
        <button
          @click="showSubmitModal = false"
          class="px-6 py-3 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-lg transition-colors duration-200"
        >
          {{ t('cancel') }}
        </button>
      </div>
    </template>
  </Dialog>
</template>

<style scoped>
/* 隐藏滚动条 */
.scrollbar-hide {
  -ms-overflow-style: none;  /* IE and Edge */
  scrollbar-width: none;  /* Firefox */
}

.scrollbar-hide::-webkit-scrollbar {
  display: none;  /* Chrome, Safari and Opera */
}


</style>

 