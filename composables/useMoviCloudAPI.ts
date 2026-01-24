import { ref, readonly } from 'vue'
import { useDev } from './useDev'

// MoviCloud API 服务
const API_BASE_URL = 'https://api.movicloud.com'
const CLIENT_VERSION = '1.0.0'

// 缓存的系统ID
let cachedSystemId: string | null = null

// 从数据库获取系统ID
const getSystemIdFromDatabase = async (): Promise<string> => {
  const { log, error: devError } = useDev()
  
  if (cachedSystemId) {
    return cachedSystemId
  }
  try {
    const storedSystemId = localStorage.getItem('movicloud_system_id')
    if (storedSystemId) {
      cachedSystemId = storedSystemId
      return storedSystemId
    }
    const installResponse = await fetch('/api/install/check')
    const installData = await installResponse.json()
    if (!installData.isInstalled) {
      throw new Error('系统尚未安装，请先完成安装')
    }
    const response = await fetch('/api/settings/system-id')
    const data = await response.json()
    if (data.success && data.system_id) {
      cachedSystemId = data.system_id
      localStorage.setItem('movicloud_system_id', data.system_id)
      return data.system_id
    }
    devError('系统已安装但无法获取系统ID，可能是数据库配置问题')
    throw new Error('系统ID获取失败，请检查数据库配置')
  } catch (error) {
    devError('获取系统ID失败:', error)
    throw error
  }
}

// 获取请求头部
const getHeaders = async (): Promise<HeadersInit> => {
  const systemId = await getSystemIdFromDatabase()
  return {
    'Content-Type': 'application/json',
    'X-System-ID': systemId,
    'X-Client-Version': CLIENT_VERSION,
    'X-Request-Timestamp': Date.now().toString()
  }
}

// 通用请求函数
const request = async (url: string, options: RequestInit = {}): Promise<any> => {
  const { error: devError } = useDev()
  
  try {
    const headers = await getHeaders()
    const response = await fetch(`${API_BASE_URL}${url}`, {
      ...options,
      headers: {
        ...headers,
        ...options.headers
      }
    })

    const data = await response.json()
    
    if (!data.success) {
      throw new Error(data.message || '请求失败')
    }
    
    return data.data
  } catch (error) {
    devError('API请求失败:', error)
    throw error
  }
}

// 获取电影资源详情
const getMovieResources = async (mediaId: string): Promise<ResourceItem[]> => {
  const data = await request(`/api/movie/${mediaId}`)
  return data.resources || []
}

// 获取电视剧资源详情
const getTVResources = async (mediaId: string, seasonNumber: number, episodeNumber?: number): Promise<ResourceItem[]> => {
  let url: string
  
  // 如果seasonNumber等于mediaId，表示获取电视剧所有资源
  if (seasonNumber.toString() === mediaId) {
    url = `/api/tv/${mediaId}/${mediaId}`
  } else {
    url = `/api/tv/${mediaId}/${seasonNumber}`
    if (episodeNumber) {
      url += `?episodeNumber=${episodeNumber}`
    }
  }
  
  const data = await request(url)
  return data.resources || []
}

// 提交电影资源
const submitMovieResource = async (resourceData: {
  mediaId: number
  resourceType: string
  cloudDriveCode: string
  driveLink: string
  resolution: string
  fileSize?: string
  videoCodec?: string
  audioCodec?: string
}): Promise<ResourceItem> => {
  return await request('/api/movie', {
    method: 'POST',
    body: JSON.stringify(resourceData)
  })
}

// 提交电视剧资源
const submitTVResource = async (resourceData: {
  mediaId: number
  seasonNumber: number
  episodeNumber?: number
  resourceType: string
  cloudDriveCode: string
  driveLink: string
  resolution: string
  fileSize?: string
  videoCodec?: string
  audioCodec?: string
}): Promise<ResourceItem> => {
  return await request('/api/tv', {
    method: 'POST',
    body: JSON.stringify(resourceData)
  })
}

// 评分资源
const rateResource = async (resourceId: number, rating: number, comment?: string): Promise<{
  id: number
  rating: number
  ratingCount: number
}> => {
  const systemId = await getSystemIdFromDatabase()
  return await request(`/api/movie/${resourceId}/rate`, {
    method: 'POST',
    body: JSON.stringify({
      rating,
      comment,
      systemId
    })
  })
}

// 举报资源
const reportResource = async (resourceId: number, reason: string, description?: string): Promise<{
  id: number
  resourceId: number
  systemId: string
  reason: string
  description?: string
  status: string
  resourceType: string
  createdAt: string
}> => {
  const systemId = await getSystemIdFromDatabase()
  return await request(`/api/movie/${resourceId}/report`, {
    method: 'POST',
    body: JSON.stringify({
      reason,
      description,
      systemId
    })
  })
}

// 健康检查
const healthCheck = async (): Promise<{
  message: string
  version: string
  timestamp: number
}> => {
  return await request('/')
}

// 通知相关类型
export interface Notification {
  id: string
  type: string
  title: string
  content: string
  data?: Record<string, any>
  is_read: boolean
  read_at: string | null
  created_at: string
}

export interface NotificationListResponse {
  notifications: Notification[]
  pagination: {
    page: number
    limit: number
    total: number
    pages: number
  }
}

export interface UnreadCountResponse {
  unread_count: number
}

// 获取通知列表
const getNotifications = async (params?: {
  page?: number
  limit?: number
  type?: string
  is_read?: boolean
}): Promise<NotificationListResponse> => {
  const queryParams = new URLSearchParams()
  if (params?.page) queryParams.append('page', params.page.toString())
  if (params?.limit) queryParams.append('limit', params.limit.toString())
  if (params?.type) queryParams.append('type', params.type)
  if (params?.is_read !== undefined) queryParams.append('is_read', params.is_read.toString())
  
  const url = `/api/notifications${queryParams.toString() ? `?${queryParams.toString()}` : ''}`
  return await request(url)
}

// 获取未读通知数量
const getUnreadNotificationCount = async (): Promise<UnreadCountResponse> => {
  return await request('/api/notifications/unread-count')
}

// 标记通知为已读
const markNotificationAsRead = async (notificationId: string): Promise<void> => {
  await request(`/api/notifications/${notificationId}/read`, {
    method: 'POST'
  })
}

// 标记所有通知为已读
const markAllNotificationsAsRead = async (): Promise<void> => {
  await request('/api/notifications/read-all', {
    method: 'POST'
  })
}

// 网盘申请相关类型
export interface ClaimStep {
  title: string
  content: string
  image: string | null
}

export interface TableColumn {
  key: string
  label: string
}

export interface TableRow {
  [key: string]: string
}

export interface MemberBenefits {
  columns: TableColumn[]
  rows: TableRow[]
}

export interface CapacityBenefits {
  columns: TableColumn[]
  rows: TableRow[]
}

export interface TaskValidity {
  columns: TableColumn[]
  rows: TableRow[]
}

export interface NetdiskProject {
  id: number
  icon: string
  name: string
  theme_color: string
  claim_instructions: string
  claim_steps: ClaimStep[]
  member_benefits: MemberBenefits
  capacity_benefits: CapacityBenefits
  task_validity: TaskValidity
  notes: string[]
  is_active: boolean
  sort_order: number
}

export interface ApplicationField {
  field_key: string
  field_label: string
  field_type: 'text' | 'textarea' | 'select' | 'file'
  is_required: boolean
  placeholder?: string
  field_options?: string[]
}

export interface ProjectDetails {
  id: number
  name: string
  application_fields: ApplicationField[]
}

export interface MemberApplication {
  id: number
  project: {
    id: number
    name: string
    icon: string
  }
  status: 'pending' | 'approved' | 'rejected'
  application_materials: Record<string, any>
  reject_reason: string | null
  reviewer: string | null
  reviewed_at: string | null
  created_at: string
}

export interface SubmitMemberApplicationRequest {
  project_id: number
  application_materials: Record<string, any>
}

// 获取可申请项目列表
const getNetdiskProjects = async (): Promise<NetdiskProject[]> => {
  return await request('/api/netdisk-applications/projects')
}

// 获取项目详情
const getNetdiskProjectDetails = async (projectId: number): Promise<ProjectDetails> => {
  return await request(`/api/netdisk-applications/projects/${projectId}`)
}

// 提交会员申请
const submitMemberApplication = async (data: SubmitMemberApplicationRequest): Promise<MemberApplication> => {
  return await request('/api/netdisk-applications/member', {
    method: 'POST',
    body: JSON.stringify(data)
  })
}

// 查看我的申请
const getMyApplications = async (): Promise<MemberApplication[]> => {
  return await request('/api/netdisk-applications/member/my')
}

// API响应类型
interface APIResponse<T = any> {
  success: boolean
  code: number
  message: string
  data?: T
  timestamp: number
}

// 资源类型
export interface ResourceItem {
  id: number
  mediaId: number
  seasonNumber?: number | null
  episodeNumber?: number | null
  resourceType: string
  cloudDriveCode: string
  driveLink: string
  resolution: string
  fileSize: string
  videoCodec: string
  audioCodec: string
  submitterId: string
  status: string
  reviewNote?: string | null
  reviewerId?: string | null
  reviewedAt?: string | null
  rating?: number | null
  ratingCount?: number | null
  createdAt: string
  updatedAt: string
}

// 评分请求类型
interface RatingRequest {
  rating: number
  comment?: string
}

// 举报请求类型
interface ReportRequest {
  report_type: string
  description: string
}

// 提交资源请求类型
interface SubmitResourceRequest {
  media_id: string
  media_type: string
  season_number?: number | null
  episode_number?: number | null
  resource_type: string
  cloud_drive_code: string
  drive_link: string
  resolution: string
  file_size: string
  video_codec: string
  audio_codec: string
}

export const useMoviCloudAPI = () => {
  const loading = ref(false)
  const error = ref('')

  return {
    // 状态
    loading: readonly(loading),
    error: readonly(error),
    
    // API函数
    getMovieResources,
    getTVResources,
    submitMovieResource,
    submitTVResource,
    rateResource,
    reportResource,
    healthCheck,
    
    // 通知API函数
    getNotifications,
    getUnreadNotificationCount,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    
    // 网盘申请API函数
    getNetdiskProjects,
    getNetdiskProjectDetails,
    submitMemberApplication,
    getMyApplications,
    
    // 工具函数
    getSystemIdFromDatabase
  }
} 