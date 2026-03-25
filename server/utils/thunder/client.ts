import * as crypto from 'crypto'
import {
  ThunderAuthConfig,
  ThunderFileConfig,
  ThunderConfig,
  AccessTokenResponse,
  CaptchaTokenResponse,
  CaptchaSignInfo,
  FileInfo,
  FilesResponse,
  FileIdByPathResult,
  ShareResponse,
  SearchResponse
} from './types'

class CurlRequest {
  private static commonHeaders = {
    'content-type': 'application/json',
    'origin': 'https://pan.xunlei.com',
    'referer': 'https://pan.xunlei.com/',
    'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36',
    'x-action': '401',
    'x-protocol-version': '301',
    'x-sdk-version': '3.4.20'
  }

  static async sendStatic(
    url: string,
    method: string = 'GET',
    headers: Record<string, string> = {},
    data?: any
  ): Promise<any> {
    const requestHeaders = {
      ...this.commonHeaders,
      ...headers
    }

    const options: RequestInit = {
      method,
      headers: requestHeaders,
      redirect: 'manual'
    }

    if (data) {
      options.body = typeof data === 'string' ? data : JSON.stringify(data)
    }

    const response = await fetch(url, options)
    const responseBody = await response.text()

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}, body: ${responseBody}`)
    }

    try {
      return JSON.parse(responseBody)
    } catch (e) {
      throw new Error(`Failed to parse response: ${(e as Error).message}`)
    }
  }
}

export class ThunderAuth {
  private domain: string
  private refreshToken: string
  private clientId: string
  private deviceId: string
  private headers: Record<string, string>

  constructor(config: ThunderAuthConfig) {
    this.domain = config.domain
    this.refreshToken = config.refreshToken
    this.clientId = config.clientId
    this.deviceId = config.deviceId
    this.headers = {
      'x-client-id': this.clientId,
      'x-device-id': this.deviceId,
      'x-device-sign': ''
    }
  }

  static fromThunderConfig(config: ThunderConfig): ThunderAuth {
    return new ThunderAuth({
      domain: config.authUrl,
      refreshToken: config.refreshToken,
      clientId: config.clientId,
      deviceId: config.deviceId
    })
  }

  async getAccessToken(): Promise<AccessTokenResponse> {
    const data = {
      client_id: this.clientId,
      grant_type: 'refresh_token',
      refresh_token: this.refreshToken
    }
    const url = `${this.domain}/v1/auth/token`
    const response = await CurlRequest.sendStatic(url, 'POST', this.headers, data)
    return response
  }

  async getCaptchaToken(
    clientVersion: string,
    email: string,
    packageName: string,
    phoneNumber: string,
    userId: string,
    username: string
  ): Promise<CaptchaTokenResponse> {
    const url = `${this.domain}/v1/shield/captcha/init`
    const captchaSignInfo = this.generateCaptchaSign(
      this.clientId,
      clientVersion,
      packageName,
      this.deviceId
    )
    const data = {
      action: 'get:/drive/v1/tasks',
      client_id: this.clientId,
      device_id: this.deviceId,
      meta: {
        captcha_sign: captchaSignInfo.sign,
        client_version: clientVersion,
        email: email,
        package_name: packageName,
        phone_number: phoneNumber,
        timestamp: captchaSignInfo.timestamp,
        user_id: userId,
        username: username
      }
    }
    const response = await CurlRequest.sendStatic(url, 'POST', this.headers, data)
    return response
  }

  async getUserInfo(accessToken: string): Promise<any> {
    const url = `${this.domain}/v1/user/me`
    const headers = {
      ...this.headers,
      'Authorization': `Bearer ${accessToken}`
    }
    const response = await CurlRequest.sendStatic(url, 'GET', headers)
    return response
  }

  generateCaptchaSign(
    clientID: string,
    clientVersion: string,
    packageName: string,
    deviceID: string
  ): CaptchaSignInfo {
    const timestamp = Math.round(Date.now()).toString()
    const baseStr = clientID + clientVersion + packageName + deviceID + timestamp

    const algorithms = [
      'Slyf1918drRdfvVF',
      '8aMrXysG81/lSUK5JjFxGCYCuFrlBL',
      'cKt0D7jwHGIn',
      'AMJGU1uXzhe',
      'opAwUQEXUBQ5XvX955RqIysmA/gMuK',
      'zc78nJHR6TQQVyZ0S0kbpc7++527LCm',
      'PSCqhcu7OtJ77s1YoC',
      '5wVeQ5M8DIURYeHycRKQ6Yr+W',
      'o8',
      '+HclH3koSIHBuX008jfMNOd94Ygx3',
      'J',
      'WrB0fGeCp+dIj+R',
      'N+wTICzuycJyYRw',
      'VCuydo5Y0F3AE'
    ]

    let str = baseStr
    for (const algorithm of algorithms) {
      str = crypto.createHash('md5').update(str + algorithm).digest('hex')
    }

    const sign = '1.' + str

    return {
      timestamp,
      sign
    }
  }
}



export class ThunderFile {
  private accessToken: string
  private domain: string
  private clientId: string
  private deviceId: string
  private captchaToken: string
  private accessTokenType: string
  private headers: Record<string, string>

  constructor(config: ThunderFileConfig) {
    this.accessToken = config.accessToken
    this.domain = config.domain
    this.clientId = config.clientId
    this.deviceId = config.deviceId
    this.captchaToken = config.captchaToken
    this.accessTokenType = config.accessTokenType || 'Bearer'
    this.headers = {
      'Authorization': `${this.accessTokenType} ${this.accessToken}`,
      'x-client-id': this.clientId,
      'x-device-id': this.deviceId,
      'x-captcha-token': this.captchaToken
    }
  }

  static fromThunderConfig(config: ThunderConfig, accessToken: string, captchaToken: string): ThunderFile {
    return new ThunderFile({
      accessToken,
      domain: config.apiUrl,
      clientId: config.clientId,
      deviceId: config.deviceId,
      captchaToken,
      accessTokenType: config.tokenType
    })
  }

  async getFiles(parentId: string = '', pageToken: string = '', limit: number = 50): Promise<FilesResponse> {
    const params: any = {
      limit: limit,
      with_audit: true,
      usage: 'DISPLAY',
      thumbnail_size: 'SIZE_SMALL',
      filters: JSON.stringify({
        phase: { eq: 'PHASE_TYPE_COMPLETE' },
        trashed: { eq: false }
      })
    }

    if (parentId) {
      params.parent_id = parentId
    }

    if (pageToken) {
      params.page_token = pageToken
    }

    const url = `${this.domain}/drive/v1/files?${new URLSearchParams(params)}`
    const response = await CurlRequest.sendStatic(url, 'GET', this.headers)
    return response
  }

  async getAllFiles(parentId: string = '', maxPages: number = 50): Promise<FileInfo[]> {
    const allFiles: FileInfo[] = []
    let pageToken = ''
    let pageCount = 0

    do {
      const filesData = await this.getFiles(parentId, pageToken, 50)

      if (!filesData.files || filesData.files.length === 0) {
        break
      }

      allFiles.push(...filesData.files)

      pageToken = filesData.next_page_token || ''
      pageCount++

      if (pageCount >= maxPages) {
        break
      }

    } while (pageToken)

    return allFiles
  }

  async getAllFilesUnlimited(parentId: string = ''): Promise<FileInfo[]> {
    const allFiles: FileInfo[] = []
    let pageToken = ''
    let pageCount = 0

    do {
      const filesData = await this.getFiles(parentId, pageToken, 50)

      if (!filesData.files || filesData.files.length === 0) {
        break
      }

      allFiles.push(...filesData.files)

      pageToken = filesData.next_page_token || ''
      pageCount++

    } while (pageToken)

    return allFiles
  }

  async getFileIdByPath(filePath: string, parentId: string = ''): Promise<FileIdByPathResult | null> {
    const pathParts = filePath.replace(/\\/g, '/').split('/').filter(Boolean)

    if (pathParts.length === 0) {
      return null
    }

    let currentParentId = parentId
    let currentPath = ''
    let fileInfo: FileInfo | null = null

    for (const pathPart of pathParts) {
      currentPath += (currentPath ? '/' : '') + pathPart

      const allFiles = await this.getAllFilesUnlimited(currentParentId)

      if (allFiles.length === 0) {
        return null
      }

      const found = allFiles.find(file => file.name === pathPart)

      if (!found) {
        return null
      }

      fileInfo = found
      currentParentId = found.id
    }

    if (!fileInfo) {
      return null
    }

    return {
      id: fileInfo.id,
      name: fileInfo.name,
      path: filePath,
      type: fileInfo.kind === 'drive#folder' ? 'folder' : 'file',
      parent_id: fileInfo.parent_id,
      size: fileInfo.size || '0',
      created_time: fileInfo.created_time || '',
      modified_time: fileInfo.modified_time || '',
      mime_type: fileInfo.mime_type || '',
      file_extension: fileInfo.file_extension || '',
      full_info: fileInfo
    }
  }

  async getFileIdByPathSimple(filePath: string, parentId: string = ''): Promise<string | null> {
    const result = await this.getFileIdByPath(filePath, parentId)
    return result ? result.id : null
  }

  async filePathExists(filePath: string, parentId: string = ''): Promise<boolean> {
    return (await this.getFileIdByPath(filePath, parentId)) !== null
  }

  async createShare(fileIds: string | string[], options: any = {}): Promise<ShareResponse> {
    const fileIdsArray = typeof fileIds === 'string' ? [fileIds] : fileIds

    const defaultOptions = {
      share_to: 'copy',
      title: '云盘资源分享',
      restore_limit: '-1',
      expiration_days: '-1',
      params: {
        subscribe_push: 'false',
        WithPassCodeInLink: 'true'
      }
    }

    const mergedOptions = { ...defaultOptions, ...options }

    const data = {
      file_ids: fileIdsArray,
      share_to: mergedOptions.share_to,
      params: mergedOptions.params,
      title: mergedOptions.title,
      restore_limit: mergedOptions.restore_limit,
      expiration_days: mergedOptions.expiration_days
    }

    const url = `${this.domain}/drive/v1/share`
    const response = await CurlRequest.sendStatic(url, 'POST', this.headers, data)
    return response
  }

  async createShareByPath(filePath: string, options: any = {}): Promise<ShareResponse | { error: string }> {
    const fileInfo = await this.getFileIdByPath(filePath)
    if (!fileInfo) {
      return { error: `文件不存在: ${filePath}` }
    }

    return this.createShare(fileInfo.id, options)
  }

  async createBatchShare(filePaths: string[], options: any = {}): Promise<ShareResponse | { error: string; errors?: string[] }> {
    const fileIds: string[] = []
    const errors: string[] = []

    for (const filePath of filePaths) {
      const fileInfo = await this.getFileIdByPath(filePath)
      if (fileInfo) {
        fileIds.push(fileInfo.id)
      } else {
        errors.push(`文件不存在: ${filePath}`)
      }
    }

    if (fileIds.length === 0) {
      return { error: '没有找到有效的文件', errors }
    }

    const result = await this.createShare(fileIds, options)
    if ('error' in result) {
      return { ...result, errors }
    }

    return result
  }

  async createPasswordShare(fileIds: string | string[], title: string = '云盘资源分享', expirationDays: number = -1): Promise<ShareResponse> {
    const options = {
      title: title,
      expiration_days: expirationDays.toString(),
      params: {
        subscribe_push: 'false',
        WithPassCodeInLink: 'true'
      }
    }

    return this.createShare(fileIds, options)
  }

  async createPublicShare(fileIds: string | string[], title: string = '云盘资源分享', expirationDays: number = -1): Promise<ShareResponse> {
    const options = {
      title: title,
      expiration_days: expirationDays.toString(),
      params: {
        subscribe_push: 'false',
        WithPassCodeInLink: 'false'
      }
    }

    return this.createShare(fileIds, options)
  }

  async getShareUrl(fileIds: string | string[], title: string = '云盘资源分享'): Promise<string | null> {
    const result = await this.createShare(fileIds, { title })

    if ('share_url' in result) {
      return result.share_url
    }

    return null
  }

  async getShareUrlWithPassword(fileIds: string | string[], title: string = '云盘资源分享'): Promise<{ url: string; password: string; full_text?: string } | null> {
    const result = await this.createShare(fileIds, { title })

    if ('share_url' in result && 'pass_code' in result) {
      return {
        url: result.share_url,
        password: result.pass_code!,
        full_text: result.share_text
      }
    }

    return null
  }

  async searchFiles(
    keyword: string,
    userId: string = '',
    parentId: string = '',
    pageToken: string = '',
    limit: number = 20,
    space: string = '*'
  ): Promise<SearchResponse> {
    const url = 'https://api-gateway-pan.xunlei.com/xlppc.searcher.api/drive_file_search'
    const params: any = {
      keyword: keyword,
      limit: limit,
      space: space
    }

    if (userId) {
      params.user_id = userId
    }

    if (parentId) {
      params.parent_id = parentId
    }

    if (pageToken) {
      params.page_token = pageToken
    }

    const fullUrl = `${url}?${new URLSearchParams(params)}`
    const response = await CurlRequest.sendStatic(fullUrl, 'GET', this.headers)
    return response
  }

  async createFolder(parentId: string, folderName: string): Promise<any> {
    const url = `${this.domain}/drive/v1/files`
    const data = {
      parent_id: parentId,
      name: folderName,
      kind: 'drive#folder',
      space: ''
    }
    const response = await CurlRequest.sendStatic(url, 'POST', this.headers, data)
    return response
  }

  async renameFile(fileId: string, newName: string): Promise<any> {
    const url = `${this.domain}/drive/v1/files/${fileId}`
    const data = {
      name: newName,
      space: ''
    }
    const response = await CurlRequest.sendStatic(url, 'PATCH', this.headers, data)
    return response
  }

  async deleteFile(fileId: string): Promise<any> {
    const url = `${this.domain}/drive/v1/files/${fileId}/trash`
    const data = {}
    const response = await CurlRequest.sendStatic(url, 'PATCH', this.headers, data)
    return response
  }

  async moveFiles(fileIds: string[], parentId: string): Promise<any> {
    const url = `${this.domain}/drive/v1/files:batchMove`
    const data = {
      ids: fileIds,
      to: {
        parent_id: parentId,
        space: ''
      },
      space: ''
    }
    const response = await CurlRequest.sendStatic(url, 'POST', this.headers, data)
    return response
  }

  async getTaskStatus(taskId: string): Promise<any> {
    const url = `${this.domain}/drive/v1/tasks/${taskId}`
    const response = await CurlRequest.sendStatic(url, 'GET', this.headers)
    return response
  }
}
