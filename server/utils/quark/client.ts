import * as crypto from 'crypto'
import { createHash } from 'crypto'
import * as querystring from 'querystring'
import {
  PAN_DOMAIN,
  DRIVE_DOMAIN,
  DRIVE_H_DOMAIN,
  USER_INFO,
  FILE_UPLOAD_PRE,
  FILE_UPDATE_HASH,
  FILE_UPLOAD_AUTH,
  FILE_UPLOAD_FINISH,
  FILE_SORT,
  FILE_MOVE,
  FILE_COPY,
  FILE_RENAME,
  FILE_DELETE,
  CREATE_FOLDER,
  SHARE,
  SHARE_PASSWORD,
  SHARE_DELETE,
  SHARE_MYPAGE_DETAIL,
  TASK,
  SHARE_SHAREPAGE_TOKEN,
  SHARE_SHAREPAGE_DETAIL,
  SHARE_SHAREPAGE_SAVE,
  FILE_SEARCH,
  type QuarkCloudDriveConfig,
  type StandardResponse,
  type QuarkFileInfo,
  type PreUploadResponse,
  type HashResponse,
  type AuthResponse,
  type FinishResponse,
  type CreateFolderResponse,
  type MoveResponse,
  type CopyResponse,
  type RenameResponse,
  type ShareStokenResponse,
  type ShareListResponse,
  type SaveShareFileResponse,
  type ShareLinkInfo,
  type ShareInfo
} from './types'

function parseCookie(cookieStr: string): Record<string, string> {
  const cookies: Record<string, string> = {}
  
  const parts = splitCookieString(cookieStr)
  for (const part of parts) {
    const trimmedPart = part.trim()
    if (!trimmedPart) continue
    
    const eqIndex = trimmedPart.indexOf('=')
    if (eqIndex === -1) continue
    
    const key = trimmedPart.slice(0, eqIndex).trim()
    const value = trimmedPart.slice(eqIndex + 1).trim()
    
    if (key) {
      cookies[key] = value
    }
  }
  
  return cookies
}

function splitCookieString(s: string): string[] {
  const parts: string[] = []
  let current = ''
  let inQuotes = false
  
  for (const char of s) {
    if (char === '"') {
      inQuotes = !inQuotes
      current += char
    } else if (char === ';' && !inQuotes) {
      parts.push(current)
      current = ''
    } else {
      current += char
    }
  }
  
  if (current) {
    parts.push(current)
  }
  
  return parts
}

function normalizePath(path: string): string {
  path = path.replace(/\\/g, '/')
  while (path.includes('//')) {
    path = path.replace(/\/\//g, '/')
  }
  if (path.length > 1 && path.endsWith('/')) {
    path = path.slice(0, -1)
  }
  return path
}

function normalizeRootDir(path: string): string {
  path = normalizePath(path)
  if (path === '' || path === '/' || path === '.') {
    return '0'
  }
  return path
}

function formatSpeed(speed: number): string {
  const KB = 1024
  const MB = 1024 * KB
  const GB = 1024 * MB
  
  if (speed >= GB) {
    return `${(speed / GB).toFixed(2)} GB/s`
  } else if (speed >= MB) {
    return `${(speed / MB).toFixed(2)} MB/s`
  } else if (speed >= KB) {
    return `${(speed / KB).toFixed(2)} KB/s`
  }
  return `${Math.floor(speed)} B/s`
}

function formatDuration(d: number): string {
  if (d < 0) return '0s'
  
  const seconds = Math.floor(d % 60)
  const minutes = Math.floor((d / 60) % 60)
  const hours = Math.floor(d / 3600)
  
  if (hours > 0) {
    return `${hours}h${minutes}m${seconds}s`
  } else if (minutes > 0) {
    return `${minutes}m${seconds}s`
  }
  return `${seconds}s`
}

function encodeHashCtx(ctx: any): string {
  if (!ctx) return ''
  const jsonData = JSON.stringify(ctx)
  return Buffer.from(jsonData).toString('base64')
}

function updateHashCtxFromHash(hash: crypto.Hash, chunkData: Buffer, totalBytes: number) {
  hash.update(chunkData)
  
  const hashSum = hash.digest()
  const h0 = hashSum.readUInt32BE(0)
  const h1 = hashSum.readUInt32BE(4)
  const h2 = hashSum.readUInt32BE(8)
  const h3 = hashSum.readUInt32BE(12)
  const h4 = hashSum.readUInt32BE(16)
  
  const newNl = totalBytes + chunkData.length
  
  return {
    hash_type: 'sha1',
    h0: String(h0),
    h1: String(h1),
    h2: String(h2),
    h3: String(h3),
    h4: String(h4),
    Nl: String(newNl),
    Nh: '0',
    data: '',
    num: '0'
  }
}

export class QuarkClient {
  private cookies: Record<string, string>
  private baseURL: string = DRIVE_DOMAIN
  private debug: boolean = false
  
  constructor(config: QuarkCloudDriveConfig) {
    this.cookies = parseCookie(config.cookies)
  }
  
  private async makeRequest(
    method: string,
    urlOrEndpoint: string,
    body?: any,
    headers?: Record<string, string>,
    skipAuth: boolean = false
  ): Promise<Record<string, any>> {
    let reqURL: string
    if (urlOrEndpoint.startsWith('http://') || urlOrEndpoint.startsWith('https://')) {
      reqURL = urlOrEndpoint
    } else {
      reqURL = this.baseURL + urlOrEndpoint
      const parsedURL = new URL(reqURL)
      parsedURL.searchParams.set('pr', 'ucpro')
      parsedURL.searchParams.set('fr', 'pc')
      reqURL = parsedURL.toString()
    }
    
    const defaultHeaders: Record<string, string> = {
      'Cookie': Object.entries(this.cookies).map(([k, v]) => `${k}=${v}`).join('; '),
      'Accept': 'application/json, text/plain, */*',
      'Accept-Language': 'zh-CN,zh;q=0.9',
      'Cache-Control': 'no-cache',
      'Pragma': 'no-cache',
      'Priority': 'u=1, i',
      'Referer': 'https://pan.quark.cn/list',
      'Sec-Ch-Ua': '"Chromium";v="142", "Google Chrome";v="142", "Not_A Brand";v="99"',
      'Sec-Ch-Ua-Arch': '"x86"',
      'Sec-Ch-Ua-Bitness': '"64"',
      'Sec-Ch-Ua-Full-Version': '"142.0.7444.163"',
      'Sec-Ch-Ua-Full-Version-List': '"Chromium";v="142.0.7444.163", "Google Chrome";v="142.0.7444.163", "Not_A Brand";v="99.0.0.0"',
      'Sec-Ch-Ua-Mobile': '?0',
      'Sec-Ch-Ua-Model': '""',
      'Sec-Ch-Ua-Platform': '"Windows"',
      'Sec-Ch-Ua-Platform-Version': '"19.0.0"',
      'Sec-Ch-Ua-Wow64': '?0',
      'Sec-Fetch-Dest': 'empty',
      'Sec-Fetch-Mode': 'cors',
      'Sec-Fetch-Site': 'same-origin',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36',
      'Origin': 'https://pan.quark.cn'
    }
    
    if (headers) {
      Object.assign(defaultHeaders, headers)
    }
    
    if (body && method !== 'GET') {
      defaultHeaders['Content-Type'] = 'application/json'
    }
    
    const options: RequestInit = {
      method,
      headers: defaultHeaders
    }
    
    if (body && method !== 'GET') {
      options.body = typeof body === 'string' ? body : JSON.stringify(body)
    }
    
    const response = await fetch(reqURL, options)
    const responseBody = await response.text()
    
    if (this.debug) {
      console.log(`[调试] 请求: ${method} ${reqURL}`)
      console.log(`[调试] 状态码: ${response.status}`)
      console.log(`[调试] 响应内容: ${responseBody}`)
    }
    
    if (!response.ok) {
      try {
        const errorResp = JSON.parse(responseBody)
        if (errorResp.message) {
          throw new Error(`status ${response.status}: ${errorResp.message}`)
        }
        if (errorResp.errmsg) {
          throw new Error(`status ${response.status}: ${errorResp.errmsg}`)
        }
        if (errorResp.code) {
          throw new Error(`status ${response.status}, code ${errorResp.code}`)
        }
      } catch (e) {
        // ignore
      }
      const bodyStr = responseBody.length > 500 ? responseBody.slice(0, 500) + '...' : responseBody
      throw new Error(`status ${response.status}: ${bodyStr}`)
    }
    
    try {
      return JSON.parse(responseBody)
    } catch (e) {
      throw new Error(`failed to decode response: ${(e as Error).message}`)
    }
  }
  
  async getUserInfo(): Promise<StandardResponse> {
    const reqURL = new URL(PAN_DOMAIN + USER_INFO)
    reqURL.searchParams.set('fr', 'pc')
    reqURL.searchParams.set('platform', 'pc')
    
    const jsonResp = await this.makeRequest('GET', reqURL.toString(), undefined, undefined, true)
    
    const success = !!jsonResp['success']
    const message = jsonResp['msg'] || ''
    const code = jsonResp['code'] || ''
    
    if (!success) {
      return {
        success: false,
        code,
        message: `API returned: ${message}`,
        data: undefined
      }
    }
    
    return {
      success: true,
      code,
      message: 'get user info success',
      data: jsonResp['data']
    }
  }
  
  async getFileInfo(remotePath: string): Promise<StandardResponse> {
    remotePath = normalizePath(remotePath)
    
    if (remotePath === '/' || remotePath === '' || remotePath === '.') {
      return {
        success: true,
        code: 'OK',
        message: '根目录',
        data: {
          fid: '0',
          file_name: '',
          path: '/',
          dir: true
        }
      }
    }
    
    return {
      success: false,
      code: 'NOT_IMPLEMENTED',
      message: 'getFileInfo 方法需要完整实现',
      data: undefined
    }
  }
  
  async listFiles(dirFid: string = '0'): Promise<StandardResponse> {
    dirFid = dirFid.trim()
    
    let pdirFid: string
    if (dirFid === '' || dirFid === '/') {
      pdirFid = '0'
    } else {
      pdirFid = dirFid
    }
    
    const allFileList: QuarkFileInfo[] = []
    let page = 1
    const pageSize = 50
    let hasMore = true
    
    while (hasMore) {
      const params = new URLSearchParams()
      params.set('uc_param_str', '')
      params.set('pdir_fid', pdirFid)
      params.set('_page', String(page))
      params.set('_size', String(pageSize))
      params.set('_fetch_total', '1')
      params.set('_fetch_sub_dirs', '0')
      params.set('_sort', 'file_type:asc,updated_at:desc')
      params.set('fetch_all_file', '1')
      params.set('fetch_risk_file_name', '1')
      
      const endpoint = FILE_SORT + '?' + params.toString()
      const respMap = await this.makeRequest('GET', endpoint)
      
      const status = respMap['status'] as number
      const code = respMap['code'] as number
      
      if (status >= 400 || code !== 0) {
        const message = respMap['message'] as string || ''
        return {
          success: false,
          code: 'LIST_FAILED',
          message: `list files failed: ${message} (status: ${status}, code: ${code})`,
          data: undefined
        }
      }
      
      const data = respMap['data'] as Record<string, any>
      const listData = data['list'] as any[]
      
      if (!listData || listData.length === 0) {
        hasMore = false
        break
      }
      
      for (const item of listData) {
        const fileInfo: QuarkFileInfo = {
          fid: item['fid'] || '',
          file_name: item['file_name'] || '',
          path: '',
          size: Number(item['size']) || 0,
          ctime: Math.floor((Number(item['created_at']) || Number(item['l_created_at']) || 0) / 1000),
          mtime: Math.floor((Number(item['updated_at']) || Number(item['l_updated_at']) || 0) / 1000),
          dir: item['dir'] || !item['file'],
          created_at: item['created_at'] || item['l_created_at'],
          updated_at: item['updated_at'] || item['l_updated_at'],
          l_created_at: item['l_created_at'],
          l_updated_at: item['l_updated_at'],
          download_url: ''
        }
        allFileList.push(fileInfo)
      }
      
      if (listData.length < pageSize) {
        hasMore = false
      } else {
        const total = data['total'] as number
        if (total) {
          hasMore = allFileList.length < total
        } else {
          hasMore = listData.length === pageSize
        }
        page++
      }
    }
    
    return {
      success: true,
      code: 'OK',
      message: '列出目录成功',
      data: { list: allFileList }
    }
  }
  
  async searchFiles(query: string, page: number = 1, pageSize: number = 50): Promise<StandardResponse> {
    const allFileList: QuarkFileInfo[] = []
    let hasMore = true
    let currentPage = page
    
    while (hasMore) {
      const params = new URLSearchParams()
      params.set('pr', 'ucpro')
      params.set('fr', 'pc')
      params.set('q', query)
      params.set('_page', String(currentPage))
      params.set('_size', String(pageSize))
      params.set('_fetch_total', '1')
      params.set('_sort', 'file_type:asc,updated_at:desc')
      params.set('_is_hl', '1')
      
      const endpoint = FILE_SEARCH + '?' + params.toString()
      const respMap = await this.makeRequest('GET', endpoint)
      
      const status = respMap['status'] as number
      const code = respMap['code'] as number
      
      if (status >= 400 || code !== 0) {
        const message = respMap['message'] as string || ''
        return {
          success: false,
          code: 'SEARCH_FAILED',
          message: `search files failed: ${message} (status: ${status}, code: ${code})`,
          data: undefined
        }
      }
      
      const data = respMap['data'] as Record<string, any>
      const listData = data['list'] as any[]
      
      if (!listData || listData.length === 0) {
        hasMore = false
        break
      }
      
      for (const item of listData) {
        const fileInfo: QuarkFileInfo = {
          fid: item['fid'] || '',
          file_name: item['file_name'] || '',
          path: '',
          size: Number(item['size']) || 0,
          ctime: Math.floor((Number(item['created_at']) || Number(item['l_created_at']) || 0) / 1000),
          mtime: Math.floor((Number(item['updated_at']) || Number(item['l_updated_at']) || 0) / 1000),
          dir: item['dir'] || !item['file'],
          created_at: item['created_at'] || item['l_created_at'],
          updated_at: item['updated_at'] || item['l_updated_at'],
          l_created_at: item['l_created_at'],
          l_updated_at: item['l_updated_at'],
          download_url: ''
        }
        allFileList.push(fileInfo)
      }
      
      if (listData.length < pageSize) {
        hasMore = false
      } else {
        const metadata = respMap['metadata'] as Record<string, any>
        const total = metadata ? metadata['_total'] as number : 0
        if (total) {
          hasMore = allFileList.length < total
        } else {
          hasMore = listData.length === pageSize
        }
        currentPage++
      }
    }
    
    return {
      success: true,
      code: 'OK',
      message: '搜索文件成功',
      data: { list: allFileList }
    }
  }
  
  async createFolder(folderName: string, pdirFid: string = '0'): Promise<StandardResponse> {
    pdirFid = normalizeRootDir(pdirFid)
    
    const data = {
      pdir_fid: pdirFid,
      file_name: folderName,
      dir_path: '',
      dir_init_lock: false
    }
    
    const respMap = await this.makeRequest('POST', CREATE_FOLDER, data)
    
    const createResp = respMap as CreateFolderResponse
    
    if (createResp.code !== 0 || createResp.status !== 200) {
      return {
        success: false,
        code: 'CREATE_FOLDER_ERROR',
        message: `create folder failed: code=${createResp.code}, status=${createResp.status}`,
        data: undefined
      }
    }
    
    return {
      success: true,
      code: 'OK',
      message: '创建文件夹成功',
      data: createResp.data
    }
  }
  
  async moveFile(srcFid: string, destFid: string): Promise<StandardResponse> {
    const data = {
      action_type: 1,
      exclude_fids: [],
      filelist: [srcFid],
      to_pdir_fid: destFid
    }
    
    const respMap = await this.makeRequest('POST', FILE_MOVE, data)
    
    const moveResp = respMap as MoveResponse
    
    if (moveResp.code !== 0 || moveResp.status !== 200) {
      return {
        success: false,
        code: 'MOVE_FAILED',
        message: `move failed: code=${moveResp.code}, status=${moveResp.status}`,
        data: undefined
      }
    }
    
    return {
      success: true,
      code: 'OK',
      message: '移动成功',
      data: { fid: moveResp.data.fid }
    }
  }
  
  async copyFile(srcFid: string, destFid: string): Promise<StandardResponse> {
    const data = {
      action_type: 1,
      exclude_fids: [],
      filelist: [srcFid],
      to_pdir_fid: destFid
    }
    
    const respMap = await this.makeRequest('POST', FILE_COPY, data)
    
    const copyResp = respMap as CopyResponse
    
    if (copyResp.code !== 0 || copyResp.status !== 200) {
      return {
        success: false,
        code: 'COPY_FAILED',
        message: `copy failed: code=${copyResp.code}, status=${copyResp.status}`,
        data: undefined
      }
    }
    
    return {
      success: true,
      code: 'OK',
      message: '复制成功',
      data: { fid: copyResp.data.fid }
    }
  }
  
  async renameFile(fid: string, newName: string): Promise<StandardResponse> {
    const data = {
      fid: fid,
      file_name: newName
    }
    
    const respMap = await this.makeRequest('POST', FILE_RENAME, data)
    
    const renameResp = respMap as RenameResponse
    
    if (renameResp.code !== 0 || renameResp.status !== 200) {
      return {
        success: false,
        code: 'RENAME_FAILED',
        message: `rename failed: code=${renameResp.code}, status=${renameResp.status}`,
        data: undefined
      }
    }
    
    return {
      success: true,
      code: 'OK',
      message: '重命名成功',
      data: { fid: renameResp.data.fid }
    }
  }
  
  async deleteFile(fidList: string[]): Promise<StandardResponse> {
    const data = {
      action_type: 2,
      filelist: fidList,
      exclude_fids: []
    }
    
    const respMap = await this.makeRequest('POST', FILE_DELETE, data)
    
    if (respMap['code'] !== 0 || respMap['status'] !== 200) {
      return {
        success: false,
        code: 'DELETE_FAILED',
        message: `delete failed: code=${respMap['code']}, status=${respMap['status']}`,
        data: undefined
      }
    }
    
    return {
      success: true,
      code: 'OK',
      message: '删除成功',
      data: undefined
    }
  }
  
  getShareInfo(text: string): ShareInfo {
    const pwdIdMatch = text.match(/\/s\/(\w+)(#\/list\/share.*\/(\w+))?/)
    if (!pwdIdMatch || pwdIdMatch.length < 2) {
      throw new Error('链接格式错误')
    }
    
    const pwdID = pwdIdMatch[1]
    
    const passcodeMatch = text.match(/提取码[:：](\S+\d{1,4}\S*)/)
    let passcode = ''
    if (passcodeMatch && passcodeMatch.length >= 2) {
      passcode = passcodeMatch[1] || ''
    }
    
    return {
      pwd_id: pwdID || '',
      passcode: passcode
    }
  }
  
  async getShareStoken(pwdID: string, passcode: string): Promise<Record<string, any>> {
    const dt = Math.floor(Math.random() * 900) + 100
    const t = Date.now()
    
    const queryParams = new URLSearchParams()
    queryParams.set('pr', 'ucpro')
    queryParams.set('fr', 'pc')
    queryParams.set('uc_param_str', '')
    queryParams.set('__dt', String(dt))
    queryParams.set('__t', String(t))
    
    const data = {
      pwd_id: pwdID,
      passcode: passcode,
      support_visit_limit_private_share: true
    }
    
    const reqURL = DRIVE_H_DOMAIN + SHARE_SHAREPAGE_TOKEN + '?' + queryParams.toString()
    const respMap = await this.makeRequest('POST', reqURL, data)
    
    const stokenResp = respMap as ShareStokenResponse
    
    if (stokenResp.code !== 0 || stokenResp.status !== 200) {
      throw new Error(`get share stoken failed: code=${stokenResp.code}, status=${stokenResp.status}`)
    }
    
    return stokenResp.data
  }
  
  async getShareList(
    pwdID: string,
    stoken: string,
    pdirFid: string = '0',
    page: number = 1,
    size: number = 50,
    sortBy: string = 'file_name',
    sortOrder: string = 'asc'
  ): Promise<Record<string, any>> {
    if (sortBy !== 'file_name' && sortBy !== 'updated_at') {
      throw new Error('sort_by 只能为 "file_name" 或 "updated_at"')
    }
    
    const sort = `file_type:asc,${sortBy}:${sortOrder}`
    const dt = Math.floor(Math.random() * 900) + 100
    const t = Date.now()
    
    const queryParams = new URLSearchParams()
    queryParams.set('pr', 'ucpro')
    queryParams.set('fr', 'pc')
    queryParams.set('uc_param_str', '')
    queryParams.set('pwd_id', pwdID)
    queryParams.set('stoken', stoken)
    queryParams.set('pdir_fid', pdirFid)
    queryParams.set('force', '0')
    queryParams.set('_page', String(page))
    queryParams.set('_size', String(size))
    queryParams.set('_fetch_banner', '1')
    queryParams.set('_fetch_share', '1')
    queryParams.set('_fetch_total', '1')
    queryParams.set('_sort', sort)
    queryParams.set('__dt', String(dt))
    queryParams.set('__t', String(t))
    
    const reqURL = DRIVE_H_DOMAIN + SHARE_SHAREPAGE_DETAIL + '?' + queryParams.toString()
    const respMap = await this.makeRequest('GET', reqURL)
    
    const listResp = respMap as ShareListResponse
    
    if (listResp.code !== 0 || listResp.status !== 200) {
      throw new Error(`get share list failed: code=${listResp.code}, status=${listResp.status}`)
    }
    
    return listResp.data
  }
  
  async saveShareFile(
    pwdID: string,
    stoken: string,
    fidList: string[] = [],
    shareTokenList: string[] = [],
    toPdirFid: string = '0',
    pdirSaveAll: boolean = true
  ): Promise<Record<string, any>> {
    const dt = Math.floor(Math.random() * 900) + 100
    const t = Date.now()
    
    const queryParams = new URLSearchParams()
    queryParams.set('pr', 'ucpro')
    queryParams.set('fr', 'pc')
    queryParams.set('uc_param_str', '')
    queryParams.set('__dt', String(dt))
    queryParams.set('__t', String(t))
    
    const data = {
      fid_list: fidList,
      share_token_list: shareTokenList,
      to_pdir_fid: toPdirFid,
      pwd_id: pwdID,
      stoken: stoken,
      pdir_fid: '0',
      pdir_save_all: pdirSaveAll,
      exclude_fids: [],
      scene: 'link'
    }
    
    const reqURL = DRIVE_DOMAIN + SHARE_SHAREPAGE_SAVE + '?' + queryParams.toString()
    const respMap = await this.makeRequest('POST', reqURL, data)
    
    const saveResp = respMap as SaveShareFileResponse
    
    if (saveResp.code !== 0 || saveResp.status !== 200) {
      throw new Error(`save share file failed: code=${saveResp.code}, status=${saveResp.status}`)
    }
    
    return saveResp.data
  }
  
  async getMyShareList(page: number = 1, size: number = 50, orderField: string = 'created_at', orderType: string = 'desc'): Promise<Record<string, any>> {
    if (page <= 0) page = 1
    if (size <= 0) size = 50
    if (!orderField) orderField = 'created_at'
    if (!orderType) orderType = 'desc'
    
    const queryParams = new URLSearchParams()
    queryParams.set('pr', 'ucpro')
    queryParams.set('fr', 'pc')
    queryParams.set('uc_param_str', '')
    queryParams.set('_page', String(page))
    queryParams.set('_size', String(size))
    queryParams.set('_order_field', orderField)
    queryParams.set('_order_type', orderType)
    queryParams.set('_fetch_total', '1')
    queryParams.set('_fetch_notify_follow', '1')
    
    const reqURL = DRIVE_DOMAIN + SHARE_MYPAGE_DETAIL + '?' + queryParams.toString()
    const respMap = await this.makeRequest('GET', reqURL)
    
    if (respMap['code'] !== 0 || respMap['status'] !== 200) {
      throw new Error(`get my share list failed: code=${respMap['code']}, status=${respMap['status']}`)
    }
    
    return respMap['data'] as Record<string, any>
  }
  
  async deleteShare(shareIds: string[]): Promise<void> {
    if (shareIds.length === 0) {
      throw new Error('share_ids cannot be empty')
    }
    
    const queryParams = new URLSearchParams()
    queryParams.set('pr', 'ucpro')
    queryParams.set('fr', 'pc')
    queryParams.set('uc_param_str', '')
    
    const data = {
      share_ids: shareIds
    }
    
    const reqURL = DRIVE_DOMAIN + SHARE_DELETE + '?' + queryParams.toString()
    const respMap = await this.makeRequest('POST', reqURL, data)
    
    if (respMap['code'] !== 0 || respMap['status'] !== 200) {
      throw new Error(`delete share failed: code=${respMap['code']}, status=${respMap['status']}, message=${respMap['message'] || ''}`)
    }
  }

  async waitForTaskComplete(taskID: string): Promise<string> {
    const maxRetries = 10
    const retryInterval = 500
    
    for (let i = 0; i < maxRetries; i++) {
      await new Promise(resolve => setTimeout(resolve, retryInterval))
      
      const queryParams = new URLSearchParams()
      queryParams.set('task_id', taskID)
      queryParams.set('retry_index', '0')
      
      const endpointWithParams = TASK + '?' + queryParams.toString()
      const respMap = await this.makeRequest('GET', endpointWithParams)
      
      console.log('[Quark] Task status response:', JSON.stringify(respMap, null, 2))
      
      if (respMap['code'] !== 0 || respMap['status'] !== 200) {
        continue
      }
      
      const taskData = respMap['data'] as Record<string, any>
      const status = taskData['status'] as number
      const shareID = taskData['share_id'] as string
      
      if (status === 2 && shareID) {
        return shareID
      }
      
      if (status === 1) {
        continue
      }
      
      if (status === 3) {
        throw new Error('task failed')
      }
    }
    
    throw new Error('task timeout')
  }

  async getShareLink(shareID: string): Promise<{ share_url: string; pwd_id: string; passcode: string; expires_at: number }> {
    console.log('[Quark] Calling getShareLink with shareID:', shareID)
    
    const data = {
      share_id: shareID
    }
    
    const respMap = await this.makeRequest('POST', SHARE_PASSWORD, data)
    
    console.log('[Quark] Share password response:', JSON.stringify(respMap, null, 2))
    
    if (respMap['code'] !== 0 || respMap['status'] !== 200) {
      throw new Error(`get share link failed: code=${respMap['code']}, status=${respMap['status']}`)
    }
    
    const linkData = respMap['data'] as Record<string, any>
    const shareUrl = linkData['share_url'] || ''
    const pwdId = linkData['pwd_id'] || ''
    let passcode = ''
    let expiresAt = 0
    
    if (linkData['passcode']) {
      passcode = String(linkData['passcode'])
    }
    
    if (linkData['expired_at']) {
      expiresAt = Number(linkData['expired_at'])
    }
    
    return {
      share_url: shareUrl,
      pwd_id: pwdId,
      passcode: passcode,
      expires_at: expiresAt
    }
  }

  async createShare(
    fidList: string[],
    passcode: string = '',
    expiredType: number = 1,
    expiredAt: number = 0
  ): Promise<StandardResponse> {
    const dt = Math.floor(Math.random() * 900) + 100
    const t = Date.now()
    
    const queryParams = new URLSearchParams()
    queryParams.set('pr', 'ucpro')
    queryParams.set('fr', 'pc')
    queryParams.set('uc_param_str', '')
    queryParams.set('__dt', String(dt))
    queryParams.set('__t', String(t))
    
    const urlType = passcode ? 2 : 1
    
    const data: any = {
      fid_list: fidList,
      title: '',
      url_type: urlType,
      expired_type: expiredType
    }
    
    if (passcode) {
      data.passcode = passcode
    }
    
    if (expiredAt > 0) {
      data.expired_at = expiredAt
    }
    
    const endpointWithParams = SHARE + '?' + queryParams.toString()
    const respMap = await this.makeRequest('POST', endpointWithParams, data)
    
    console.log('[Quark] Share response:', JSON.stringify(respMap, null, 2))
    
    if (respMap['code'] !== 0 || respMap['status'] !== 200) {
      return {
        success: false,
        code: 'SHARE_FAILED',
        message: `分享失败: code=${respMap['code']}, status=${respMap['status']}`,
        data: undefined
      }
    }
    
    const shareData = respMap['data'] as Record<string, any>
    let shareID = ''
    const taskSync = shareData['task_sync'] as boolean
    const taskID = shareData['task_id'] as string
    
    if (shareData['task_resp'] && shareData['task_resp']['data']) {
      shareID = shareData['task_resp']['data']['share_id'] || ''
    }
    
    if (!shareID && shareData['share_id']) {
      shareID = shareData['share_id'] as string
    }
    
    if (!shareID && shareData['data'] && shareData['data']['share_id']) {
      shareID = shareData['data']['share_id'] as string
    }
    
    if (!shareID && !taskSync && taskID) {
      console.log('[Quark] Task not synced, waiting for completion...')
      shareID = await this.waitForTaskComplete(taskID)
    }
    
    if (!shareID) {
      return {
        success: false,
        code: 'SHARE_ID_NOT_FOUND',
        message: '未找到分享ID',
        data: undefined
      }
    }
    
    try {
      const shareLinkInfo = await this.getShareLink(shareID)
      return {
        success: true,
        code: 'OK',
        message: '分享成功',
        data: shareLinkInfo
      }
    } catch (error) {
      console.log('[Quark] Failed to get share link, falling back to manual construction:', error)
      const shareUrl = shareID ? `https://pan.quark.cn/s/${shareID}` : ''
      return {
        success: true,
        code: 'OK',
        message: '分享成功',
        data: {
          share_url: shareUrl,
          passcode: passcode,
          pwd_id: shareID,
          expires_at: 0
        }
      }
    }
  }
}
