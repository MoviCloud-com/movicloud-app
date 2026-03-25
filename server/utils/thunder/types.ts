export interface ThunderAuthConfig {
  domain: string
  refreshToken: string
  clientId: string
  deviceId: string
}

export interface ThunderFileConfig {
  accessToken: string
  domain: string
  clientId: string
  deviceId: string
  captchaToken: string
  accessTokenType?: string
}

export interface AccessTokenResponse {
  access_token: string
  token_type: string
  refresh_token: string
  expires_in: number
}

export interface CaptchaTokenResponse {
  captcha_token: string
}

export interface CaptchaSignInfo {
  timestamp: string
  sign: string
}

export interface FileInfo {
  id: string
  name: string
  kind: string
  parent_id: string
  size?: string
  created_time?: string
  modified_time?: string
  mime_type?: string
  file_extension?: string
  user_id?: string
  revision?: string
  starred?: boolean
  web_content_link?: string
  icon_link?: string
  thumbnail_link?: string
  md5_checksum?: string
  hash?: string
  links?: Record<string, any>
  phase?: string
  audit?: {
    status: string
    message: string
    title: string
  }
  medias?: Array<{
    media_id: string
    media_name: string
    video: any
    link: {
      url: string
      token: string
      expire: string
      type: string
    }
    need_more_quota: boolean
    vip_types: any[]
    redirect_link: string
    icon_link: string
    is_default: boolean
    priority: number
    is_origin: boolean
    resolution_name: string
    is_visible: boolean
    category: string
    audio: any
  }>
  trashed?: boolean
  delete_time?: string
  original_url?: string
  params?: Record<string, any>
  original_file_index?: number
  space?: string
  apps?: any[]
  writable?: boolean
  folder_type?: string
  collection?: any
  sort_name?: string
  user_modified_time?: string
  spell_name?: any[]
  file_category?: string
  tags?: any[]
  reference_events?: any[]
  reference_resource?: any
  statistics?: any
  original_create_time?: string
  source?: string
  CollectionID?: string
}

export interface FilesResponse {
  kind: string
  files: FileInfo[]
  next_page_token?: string
  version?: string
  version_outdated?: boolean
  sync_time?: string
  top_files?: FileInfo[]
  folder_type?: string
}

export interface FileIdByPathResult {
  id: string
  name: string
  path: string
  type: 'folder' | 'file'
  parent_id: string
  size: string
  created_time: string
  modified_time: string
  mime_type: string
  file_extension: string
  full_info: FileInfo
}

export interface ShareResponse {
  share_url: string
  pass_code?: string
  share_text?: string
}

export interface SearchResponse {
  items: FileInfo[]
  next_page_token?: string
}

export interface StandardResponse<T = any> {
  success: boolean
  code: string
  message: string
  data?: T
}

export interface ThunderConfig {
  apiUrl: string
  authUrl: string
  clientId: string
  deviceId: string
  refreshToken: string
  tokenType: string
  accessTokenExpireAt: number
  captchaSign: string
  captchaClientVersion: string
  captchaEmail: string
  captchaPackageName: string
  captchaPhoneNumber: string
  captchaTimestamp: string
  captchaUserId: string
  captchaUsername: string
}
