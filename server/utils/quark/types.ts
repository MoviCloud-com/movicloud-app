export const PAN_DOMAIN = 'https://pan.quark.cn'
export const DRIVE_DOMAIN = 'https://drive-pc.quark.cn'
export const DRIVE_H_DOMAIN = 'https://drive-h.quark.cn'

export const USER_INFO = '/account/info'
export const FILE_UPLOAD_PRE = '/1/clouddrive/file/upload/pre'
export const FILE_UPDATE_HASH = '/1/clouddrive/file/update/hash'
export const FILE_UPLOAD_AUTH = '/1/clouddrive/file/upload/auth'
export const FILE_UPLOAD_FINISH = '/1/clouddrive/file/upload/finish'
export const FILE_DOWNLOAD = '/1/clouddrive/file/download'
export const FILE_SORT = '/1/clouddrive/file/sort'
export const FILE_MOVE = '/1/clouddrive/file/move'
export const FILE_COPY = '/1/clouddrive/file/copy'
export const FILE_RENAME = '/1/clouddrive/file/rename'
export const FILE_DELETE = '/1/clouddrive/file/delete'
export const CREATE_FOLDER = '/1/clouddrive/file'
export const SHARE = '/1/clouddrive/share'
export const SHARE_PASSWORD = '/1/clouddrive/share/password'
export const SHARE_DELETE = '/1/clouddrive/share/delete'
export const SHARE_MYPAGE_DETAIL = '/1/clouddrive/share/mypage/detail'
export const TASK = '/1/clouddrive/task'
export const SHARE_SHAREPAGE_TOKEN = '/1/clouddrive/share/sharepage/token'
export const SHARE_SHAREPAGE_DETAIL = '/1/clouddrive/share/sharepage/detail'
export const SHARE_SHAREPAGE_SAVE = '/1/clouddrive/share/sharepage/save'
export const FILE_SEARCH = '/1/clouddrive/file/search'

export interface QuarkFileInfo {
  fid: string
  file_name: string
  path: string
  size: number
  ctime: number
  mtime: number
  dir: boolean
  download_url?: string
  created_at?: number
  updated_at?: number
  l_created_at?: number
  l_updated_at?: number
}

export interface QuarkListResponse {
  data: {
    list: QuarkFileInfo[]
  }
  errno: number
  errmsg: string
}

export interface StandardResponse {
  success: boolean
  code: string
  message: string
  data?: Record<string, any>
}

export interface PreUploadResponse {
  code: number
  status: number
  data: {
    task_id: string
    bucket: string
    obj_key: string
    upload_id: string
    upload_url: string
    auth_info: any
    callback: any
  }
  metadata: {
    part_size: number
  }
}

export interface HashResponse {
  code: number
  status: number
  data: {
    finish: boolean
  }
}

export interface HashCtx {
  hash_type: string
  h0: string
  h1: string
  h2: string
  h3: string
  h4: string
  Nl: string
  Nh: string
  data: string
  num: string
}

export interface AuthResponse {
  code: number
  status: number
  data: {
    auth_key: string
  }
}

export interface FinishResponse {
  code: number
  status: number
  data: Record<string, any>
}

export interface CreateFolderResponse {
  code: number
  status: number
  data: Record<string, any>
}

export interface MoveResponse {
  code: number
  status: number
  data: {
    fid: string
  }
}

export interface CopyResponse {
  code: number
  status: number
  data: {
    fid: string
  }
}

export interface RenameResponse {
  code: number
  status: number
  data: {
    fid: string
  }
}

export interface ShareInfo {
  pwd_id: string
  passcode: string
}

export interface ShareStokenResponse {
  code: number
  status: number
  data: Record<string, any>
}

export interface ShareListResponse {
  code: number
  status: number
  data: Record<string, any>
}

export interface SaveShareFileResponse {
  code: number
  status: number
  data: Record<string, any>
}

export interface ShareLinkInfo {
  share_url: string
  passcode: string
  pwd_id: string
  expires_at: number
}

export interface UploadProgress {
  progress: number
  uploaded: number
  total: number
  speed: number
  speed_str: string
  remaining: number
  remaining_str: string
  elapsed: number
}

export interface UploadState {
  file_path: string
  dest_path: string
  file_size: number
  upload_id: string
  task_id: string
  bucket: string
  obj_key: string
  upload_url: string
  part_size: number
  uploaded_parts: Record<number, string>
  mime_type: string
  auth_info: any
  callback: any
  hash_ctx?: HashCtx
  created_at: Date
}

export interface QuarkCloudDriveConfig {
  cookies: string
}
