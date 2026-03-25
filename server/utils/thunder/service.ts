import {
  ThunderConfig,
  ThunderAuth,
  ThunderFile,
  FileIdByPathResult,
  ShareResponse,
  SearchResponse,
  FileInfo,
  AccessTokenResponse
} from './index'
import { configManager } from '../config-manager'

export class ThunderService {
  private static config: ThunderConfig

  private static defaultConfig: Omit<ThunderConfig, 'captchaUserId'> = {
    apiUrl: 'https://api-pan.xunlei.com',
    authUrl: 'https://xluser-ssl.xunlei.com',
    clientId: 'Xqp0kJBXWhwaTpB6',
    deviceId: '38734c003d69492502a9ea68ace19e8e',
    refreshToken: '',
    tokenType: 'Bearer',
    accessTokenExpireAt: 0,
    captchaSign: '1.f540c0797eb496e3736e4334199c7dec',
    captchaClientVersion: '1.79.8',
    captchaEmail: '',
    captchaPackageName: 'pan.xunlei.com',
    captchaPhoneNumber: '',
    captchaTimestamp: '',
    captchaUsername: ''
  }

  static setConfig(config: Partial<ThunderConfig> & { captchaUserId: string }): void {
    if (!config.captchaUserId) {
      throw new Error('captchaUserId is required')
    }
    this.config = { ...this.defaultConfig, ...config }
  }

  static async getAccessToken(): Promise<string> {
    const auth = ThunderAuth.fromThunderConfig(this.config)
    const accessTokenResponse = await auth.getAccessToken()
    this.setAccessToken(accessTokenResponse)
    return accessTokenResponse.access_token
  }

  private static setAccessToken(accessTokenResponse: AccessTokenResponse): void {
    const cloudDriveSettings = configManager.getCloudDriveSettings()
    const xunleiAccounts = cloudDriveSettings.xunlei || []
    
    for (const account of xunleiAccounts) {
      if (account.refreshToken === this.config.refreshToken) {
        account.refreshToken = accessTokenResponse.refresh_token
        break
      }
    }
    
    cloudDriveSettings.xunlei = xunleiAccounts
    configManager.setCloudDriveSettings(cloudDriveSettings)
  }

  static async getCaptchaToken(): Promise<string> {
    const auth = ThunderAuth.fromThunderConfig(this.config)
    const captchaTokenResponse = await auth.getCaptchaToken(
      this.config.captchaClientVersion,
      this.config.captchaEmail,
      this.config.captchaPackageName,
      this.config.captchaPhoneNumber,
      this.config.captchaUserId,
      this.config.captchaUsername
    )
    return captchaTokenResponse.captcha_token
  }

  static async getFilesByPath(path: string): Promise<FileIdByPathResult | null> {
    const accessToken = await this.getAccessToken()
    const captchaToken = await this.getCaptchaToken()
    const file = ThunderFile.fromThunderConfig(this.config, accessToken, captchaToken)
    return file.getFileIdByPath(path)
  }

  static async createShareByPath(path: string): Promise<ShareResponse | { error: string }> {
    const accessToken = await this.getAccessToken()
    const captchaToken = await this.getCaptchaToken()
    const file = ThunderFile.fromThunderConfig(this.config, accessToken, captchaToken)
    return file.createShareByPath(path)
  }

  static async search(keyword: string): Promise<SearchResponse> {
    const accessToken = await this.getAccessToken()
    const captchaToken = await this.getCaptchaToken()
    const file = ThunderFile.fromThunderConfig(this.config, accessToken, captchaToken)
    return file.searchFiles(keyword, this.config.captchaUserId)
  }

  static async createShareByName(path: string): Promise<ShareResponse | { error: string }> {
    const pathArr = path.split('/')
    const filename = pathArr.pop() || ''
    const searchResult = await this.search(filename)
    
    if (searchResult.items && searchResult.items.length > 0) {
      const accessToken = await this.getAccessToken()
      const captchaToken = await this.getCaptchaToken()
      const file = ThunderFile.fromThunderConfig(this.config, accessToken, captchaToken)
      const firstItem = searchResult.items[0]
      if (!firstItem) {
        return { error: `文件不存在: ${filename}` }
      }
      return file.createShare(firstItem.id)
    } else {
      return { error: `文件不存在: ${filename}` }
    }
  }

  static async getFiles(parentId: string = ''): Promise<FileInfo[]> {
    const accessToken = await this.getAccessToken()
    const captchaToken = await this.getCaptchaToken()
    const file = ThunderFile.fromThunderConfig(this.config, accessToken, captchaToken)
    return file.getAllFilesUnlimited(parentId)
  }

  static async createShare(fileIds: string | string[], options: any = {}): Promise<ShareResponse> {
    const accessToken = await this.getAccessToken()
    const captchaToken = await this.getCaptchaToken()
    const file = ThunderFile.fromThunderConfig(this.config, accessToken, captchaToken)
    return file.createShare(fileIds, options)
  }

  static async createFolder(parentId: string, folderName: string): Promise<any> {
    const accessToken = await this.getAccessToken()
    const captchaToken = await this.getCaptchaToken()
    const file = ThunderFile.fromThunderConfig(this.config, accessToken, captchaToken)
    return file.createFolder(parentId, folderName)
  }

  static async renameFile(fileId: string, newName: string): Promise<any> {
    const accessToken = await this.getAccessToken()
    const captchaToken = await this.getCaptchaToken()
    const file = ThunderFile.fromThunderConfig(this.config, accessToken, captchaToken)
    return file.renameFile(fileId, newName)
  }

  static async deleteFile(fileId: string): Promise<any> {
    const accessToken = await this.getAccessToken()
    const captchaToken = await this.getCaptchaToken()
    const file = ThunderFile.fromThunderConfig(this.config, accessToken, captchaToken)
    return file.deleteFile(fileId)
  }

  static async moveFiles(fileIds: string[], parentId: string): Promise<any> {
    const accessToken = await this.getAccessToken()
    const captchaToken = await this.getCaptchaToken()
    const file = ThunderFile.fromThunderConfig(this.config, accessToken, captchaToken)
    return file.moveFiles(fileIds, parentId)
  }

  static async getTaskStatus(taskId: string): Promise<any> {
    const accessToken = await this.getAccessToken()
    const captchaToken = await this.getCaptchaToken()
    const file = ThunderFile.fromThunderConfig(this.config, accessToken, captchaToken)
    return file.getTaskStatus(taskId)
  }

  static async getUserInfo(): Promise<any> {
    const accessToken = await this.getAccessToken()
    const auth = ThunderAuth.fromThunderConfig(this.config)
    return auth.getUserInfo(accessToken)
  }
}
