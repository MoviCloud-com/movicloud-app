import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs'
import { join } from 'path'
import bcrypt from 'bcrypt'
import { devLog, devError } from './dev'

/**
 * .conf 配置文件管理器
 * 支持类似 qBittorrent 的配置文件格式
 */

interface ConfigSection {
  [key: string]: string | number | boolean | string[] | ConfigSection
}

interface ConfigData {
  [section: string]: ConfigSection
}

export class ConfigManager {
  private configPath: string
  private config: ConfigData = {}

  constructor() {
    const cwd = process.cwd()
    // 配置文件路径：始终使用运行时工作目录的 data 文件夹
    this.configPath = join(cwd, 'data', 'movicloud.conf')
    
    // 确保 data 目录存在
    const dataDir = join(cwd, 'data')
    if (!existsSync(dataDir)) {
      mkdirSync(dataDir, { recursive: true })
    }
    
    // 加载配置
    this.loadConfig()
  }

  /**
   * 加载配置文件
   */
  private loadConfig(): void {
    if (existsSync(this.configPath)) {
      try {
        const content = readFileSync(this.configPath, 'utf-8')
        this.config = this.parseConfig(content)
        devLog('✅ 配置文件加载成功:', this.configPath)
      } catch (error) {
        devError('加载配置文件失败:', error)
        this.config = {}
      }
    } else {
      devLog('📝 配置文件不存在，使用默认配置')
      this.config = this.getDefaultConfig()
      this.saveConfig()
    }
  }

  /**
   * 解析 .conf 文件内容
   */
  private parseConfig(content: string): ConfigData {
    const config: ConfigData = {}
    let currentSection = ''
    
    const lines = content.split('\n')
    
    for (const line of lines) {
      const trimmed = line.trim()
      
      // 跳过空行和注释
      if (!trimmed || trimmed.startsWith('#')) {
        continue
      }
      
      // 匹配节 [Section]
      const sectionMatch = trimmed.match(/^\[(.+)\]$/)
      if (sectionMatch) {
        currentSection = sectionMatch[1] || ''
        if (!config[currentSection]) {
          config[currentSection] = {}
        }
        continue
      }
      
      // 匹配键值对 Key=Value 或 Key\SubKey=Value
      const keyValueMatch = trimmed.match(/^(.+?)=(.*)$/)
      if (keyValueMatch && currentSection) {
        const key = keyValueMatch[1]?.trim() || ''
        let value: string | number | boolean | string[] = keyValueMatch[2]?.trim() ?? ''
        
        // 处理特殊值
        if (value === 'true') {
          value = true
        } else if (value === 'false') {
          value = false
        } else if (value.startsWith('@ByteArray(') && value.endsWith(')')) {
          // 处理 @ByteArray 格式（用于密码哈希）
          value = value.slice(11, -1) // 移除 @ByteArray( 和 )
        } else if (value.startsWith('@Invalid()')) {
          // 处理 @Invalid() 格式
          value = ''
        } else if (value === '[object Object]') {
          // 处理错误的 [object Object] 字符串
          value = {}
        } else if (value.startsWith('[') || value.startsWith('{')) {
          // 尝试解析 JSON（处理数组和对象）
          try {
            value = JSON.parse(value)
          } catch {
            // 如果解析失败，保留原样
          }
        } else if (!isNaN(Number(value)) && value !== '' && !value.includes('.')) {
          // 尝试转换为数字（排除浮点数，避免时间戳被转换）
          // 只转换纯整数
          const numValue = Number(value)
          if (Number.isInteger(numValue)) {
            value = numValue
          }
        }
        
        // 处理嵌套键（使用 \ 分隔）
        const keys = key.split('\\')
        let target: ConfigSection = config[currentSection]!
        
        for (let i = 0; i < keys.length - 1; i++) {
          const k = keys[i]
          if (!k) continue
          if (!target[k] || typeof target[k] !== 'object' || Array.isArray(target[k]) || target[k] === null) {
            target[k] = {}
          }
          target = target[k] as ConfigSection
        }
        
        const lastKey = keys[keys.length - 1]
        if (lastKey) {
          target[lastKey] = value
        }
      }
    }
    
    return config
  }

  /**
   * 将配置对象转换为 .conf 文件格式
   */
  private stringifyConfig(config: ConfigData): string {
    const lines: string[] = []
    
    for (const [section, sectionData] of Object.entries(config)) {
      lines.push(`[${section}]`)
      
      const flatten = (obj: ConfigSection, prefix: string = ''): void => {
        for (const [key, value] of Object.entries(obj)) {
          const fullKey = prefix ? `${prefix}\\${key}` : key
          
          if (typeof value === 'object' && value !== null && !Array.isArray(value) && Object.keys(value).length > 0) {
            // 只有非空对象才递归展开
            flatten(value as ConfigSection, fullKey)
          } else {
            let stringValue: string
            if (typeof value === 'boolean') {
              stringValue = value ? 'true' : 'false'
            } else if (Array.isArray(value) || typeof value === 'object') {
              // 数组或对象使用 JSON 序列化
              stringValue = JSON.stringify(value)
            } else if (typeof value === 'number') {
              stringValue = String(value)
            } else {
              stringValue = String(value ?? '')
            }
            lines.push(`${fullKey}=${stringValue}`)
          }
        }
      }
      
      flatten(sectionData)
      lines.push('') // 节之间空行
    }
    
    return lines.join('\n')
  }

  /**
   * 获取默认配置
   */
  private getDefaultConfig(): ConfigData {
    return {
      Application: {
        Version: '1.0.4',
        Installed: false,
        InstalledAt: '',
        MigrationVersion: 1
      },
      Settings: {
        TMDB: {
          ApiKey: '',
          ApiBaseUrl: 'https://api.tmdb.org',
          ImageBaseUrl: 'https://image.tmdb.org'
        },
        General: {
          SiteName: 'MoviCloud',
          SiteDescription: '影视云盘',
          ThemeMode: 'auto',
          Language: 'zh-CN'
        },
        System: {
          SystemId: ''
        }
      },
      Users: {}
    }
  }

  /**
   * 保存配置文件
   */
  private saveConfig(): void {
    try {
      const content = this.stringifyConfig(this.config)
      writeFileSync(this.configPath, content, 'utf-8')
      devLog('✅ 配置文件已保存:', this.configPath)
    } catch (error) {
      devError('保存配置文件失败:', error)
      throw error
    }
  }

  /**
   * 获取配置值
   */
  get(section: string, key: string, defaultValue: any = null): any {
    if (!this.config[section]) {
      return defaultValue
    }
    
    const keys = key.split('\\')
    let value: any = this.config[section]
    
    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k]
      } else {
        return defaultValue
      }
    }
    
    return value !== undefined ? value : defaultValue
  }

  /**
   * 设置配置值
   */
  set(section: string, key: string, value: any): void {
    if (!this.config[section]) {
      this.config[section] = {}
    }
    
    const keys = key.split('\\')
    let target: ConfigSection = this.config[section]!
    
    for (let i = 0; i < keys.length - 1; i++) {
      const k = keys[i]
      if (!k) continue
      if (!target[k] || typeof target[k] !== 'object' || Array.isArray(target[k])) {
        target[k] = {}
      }
      target = target[k] as ConfigSection
    }
    
    const lastKey = keys[keys.length - 1]
    if (lastKey) {
      target[lastKey] = value
    }
    this.saveConfig()
  }

  /**
   * 删除配置值
   */
  delete(section: string, key: string): void {
    if (!this.config[section]) {
      return
    }
    
    const keys = key.split('\\')
    let target: ConfigSection | undefined = this.config[section]
    
    if (!target) {
      return
    }
    
    for (let i = 0; i < keys.length - 1; i++) {
      const k = keys[i]
      if (!k) return
      if (!target[k] || typeof target[k] !== 'object' || Array.isArray(target[k])) {
        return
      }
      target = target[k] as ConfigSection
    }
    
    const lastKey = keys[keys.length - 1]
    if (lastKey) {
      delete target[lastKey]
    }
    this.saveConfig()
  }

  /**
   * 获取整个节
   */
  getSection(section: string): ConfigSection | null {
    return this.config[section] || null
  }

  /**
   * 设置整个节
   */
  setSection(section: string, data: ConfigSection): void {
    this.config[section] = data
    this.saveConfig()
  }

  /**
   * 获取所有配置
   */
  getAll(): ConfigData {
    return JSON.parse(JSON.stringify(this.config))
  }

  // ========== 用户相关方法 ==========

  /**
   * 创建用户
   */
  async createUser(username: string, password: string, nickname?: string, role: 'admin' | 'user' = 'user'): Promise<void> {
    const passwordHash = await bcrypt.hash(password, 10)
    const userId = Date.now().toString() // 简单的 ID 生成
    
    if (!this.config.Users) {
      this.config.Users = {}
    }
    
    // 使用扁平化的键存储用户数据
    const userPrefix = `user_${userId}`
    this.set('Users', `${userPrefix}\\id`, userId)
    this.set('Users', `${userPrefix}\\username`, username)
    this.set('Users', `${userPrefix}\\nickname`, nickname || username)
    this.set('Users', `${userPrefix}\\password_hash`, passwordHash)
    this.set('Users', `${userPrefix}\\role`, role)
    this.set('Users', `${userPrefix}\\email`, '')
    this.set('Users', `${userPrefix}\\avatar`, '')
    this.set('Users', `${userPrefix}\\is_active`, true)
    this.set('Users', `${userPrefix}\\created_at`, new Date().toISOString())
    this.set('Users', `${userPrefix}\\updated_at`, new Date().toISOString())
  }

  /**
   * 验证用户
   */
  async verifyUser(username: string, password: string): Promise<boolean> {
    const user = this.getUserByUsername(username)
    if (!user) {
      return false
    }
    
    // 检查用户是否激活
    const isActive = this.get('Users', `user_${user.id}\\is_active`, false)
    if (!isActive || isActive === 'false') {
      return false
    }
    
    const passwordHash = this.get('Users', `user_${user.id}\\password_hash`)
    if (!passwordHash) {
      return false
    }
    
    return bcrypt.compare(password, passwordHash as string)
  }
  
  /**
   * 根据用户名获取用户（内部方法）
   */
  private getUserByUsername(username: string): any {
    if (!this.config.Users) {
      return null
    }
    
    // 遍历所有用户键
    for (const key of Object.keys(this.config.Users)) {
      if (key.startsWith('user_')) {
        const userId = key.replace('user_', '')
        const userUsername = this.get('Users', `${key}\\username`)
        if (userUsername === username) {
          return this.getUserById(userId)
        }
      }
    }
    
    return null
  }

  /**
   * 获取用户
   */
  getUser(username: string): any {
    return this.getUserByUsername(username)
  }

  /**
   * 根据 ID 获取用户
   */
  getUserById(id: string): any {
    if (!this.config.Users) {
      return null
    }
    
    const userPrefix = `user_${id}`
    const isActive = this.get('Users', `${userPrefix}\\is_active`, false)
    
    if (!isActive) {
      return null
    }
    
    return {
      id: this.get('Users', `${userPrefix}\\id`),
      username: this.get('Users', `${userPrefix}\\username`),
      nickname: this.get('Users', `${userPrefix}\\nickname`),
      email: this.get('Users', `${userPrefix}\\email`, ''),
      avatar: this.get('Users', `${userPrefix}\\avatar`, ''),
      role: this.get('Users', `${userPrefix}\\role`),
      created_at: this.get('Users', `${userPrefix}\\created_at`),
      updated_at: this.get('Users', `${userPrefix}\\updated_at`)
    }
  }

  /**
   * 更新用户昵称
   */
  updateUserNickname(userId: string, nickname: string): void {
    const userPrefix = `user_${userId}`
    this.set('Users', `${userPrefix}\\nickname`, nickname)
    this.set('Users', `${userPrefix}\\updated_at`, new Date().toISOString())
  }

  /**
   * 更新用户名
   */
  updateUserUsername(userId: string, username: string): void {
    const userPrefix = `user_${userId}`
    this.set('Users', `${userPrefix}\\username`, username)
    this.set('Users', `${userPrefix}\\updated_at`, new Date().toISOString())
  }

  /**
   * 更新用户邮箱
   */
  updateUserEmail(userId: string, email: string): void {
    const userPrefix = `user_${userId}`
    this.set('Users', `${userPrefix}\\email`, email)
    this.set('Users', `${userPrefix}\\updated_at`, new Date().toISOString())
  }

  /**
   * 更新用户头像
   */
  updateUserAvatar(userId: string, avatar: string): void {
    const userPrefix = `user_${userId}`
    this.set('Users', `${userPrefix}\\avatar`, avatar)
    this.set('Users', `${userPrefix}\\updated_at`, new Date().toISOString())
  }

  /**
   * 更新用户密码
   */
  async updateUserPassword(userId: string, newPassword: string): Promise<void> {
    const passwordHash = await bcrypt.hash(newPassword, 10)
    const userPrefix = `user_${userId}`
    this.set('Users', `${userPrefix}\\password_hash`, passwordHash)
    this.set('Users', `${userPrefix}\\updated_at`, new Date().toISOString())
  }

  /**
   * 验证用户密码
   */
  async verifyUserPassword(userId: string, currentPassword: string): Promise<boolean> {
    const userPrefix = `user_${userId}`
    const passwordHash = this.get('Users', `${userPrefix}\\password_hash`)
    
    if (!passwordHash) {
      return false
    }
    
    return bcrypt.compare(currentPassword, passwordHash as string)
  }

  /**
   * 检查是否有管理员用户
   */
  hasAdminUser(): boolean {
    if (!this.config.Users) {
      return false
    }
    
    // 遍历所有用户键
    for (const key of Object.keys(this.config.Users)) {
      if (key.startsWith('user_')) {
        const role = this.get('Users', `${key}\\role`)
        const isActive = this.get('Users', `${key}\\is_active`, false)
        if (role === 'admin' && isActive) {
          return true
        }
      }
    }
    
    return false
  }

  /**
   * 获取所有用户
   */
  getAllUsers(): any[] {
    if (!this.config.Users) {
      return []
    }
    
    const users: any[] = []
    
    // 遍历所有用户键
    for (const key of Object.keys(this.config.Users)) {
      if (key.startsWith('user_')) {
        const userId = key.replace('user_', '')
        const user = this.getUserById(userId)
        if (user) {
          users.push(user)
        }
      }
    }
    
    return users
  }

  // ========== 设置相关方法 ==========

  /**
   * 获取设置
   */
  getSetting(key: string): string | null {
    // 映射旧的 key 到新的配置路径
    const keyMap: Record<string, string> = {
      'tmdb_api_key': 'Settings\\TMDB\\ApiKey',
      'tmdb_api_base_url': 'Settings\\TMDB\\ApiBaseUrl',
      'tmdb_image_base_url': 'Settings\\TMDB\\ImageBaseUrl',
      'site_name': 'Settings\\General\\SiteName',
      'site_description': 'Settings\\General\\SiteDescription',
      'theme_mode': 'Settings\\General\\ThemeMode',
      'language': 'Settings\\General\\Language',
      'system_id': 'Settings\\System\\SystemId'
    }
    
    const configKey = keyMap[key] || key
    const value = this.get('Settings', configKey)
    
    if (value === null || value === undefined) {
      return null
    }
    
    return String(value)
  }

  /**
   * 设置设置
   */
  setSetting(key: string, value: string): void {
    const keyMap: Record<string, string> = {
      'tmdb_api_key': 'Settings\\TMDB\\ApiKey',
      'tmdb_api_base_url': 'Settings\\TMDB\\ApiBaseUrl',
      'tmdb_image_base_url': 'Settings\\TMDB\\ImageBaseUrl',
      'site_name': 'Settings\\General\\SiteName',
      'site_description': 'Settings\\General\\SiteDescription',
      'theme_mode': 'Settings\\General\\ThemeMode',
      'language': 'Settings\\General\\Language',
      'system_id': 'Settings\\System\\SystemId'
    }
    
    const configKey = keyMap[key] || key
    this.set('Settings', configKey, value)
  }

  /**
   * 获取所有设置
   */
  getAllSettings(): Record<string, string> {
    const settings: Record<string, string> = {}
    
    const reverseKeyMap: Record<string, string> = {
      'Settings\\TMDB\\ApiKey': 'tmdb_api_key',
      'Settings\\TMDB\\ApiBaseUrl': 'tmdb_api_base_url',
      'Settings\\TMDB\\ImageBaseUrl': 'tmdb_image_base_url',
      'Settings\\Proxy\\Enabled': 'proxy_enabled',
      'Settings\\Proxy\\HttpProxy': 'http_proxy',
      'Settings\\Proxy\\HttpsProxy': 'https_proxy',
      'Settings\\Proxy\\AllProxy': 'all_proxy',
      'Settings\\General\\SiteName': 'site_name',
      'Settings\\General\\SiteDescription': 'site_description',
      'Settings\\General\\ThemeMode': 'theme_mode',
      'Settings\\General\\Language': 'language',
      'Settings\\System\\SystemId': 'system_id'
    }
    
    const settingsSection = this.getSection('Settings')
    if (settingsSection) {
      const flatten = (obj: ConfigSection, prefix: string = ''): void => {
        for (const [key, value] of Object.entries(obj)) {
          const fullKey = prefix ? `${prefix}\\${key}` : key
          
          if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
            flatten(value as ConfigSection, fullKey)
          } else {
            const oldKey = reverseKeyMap[fullKey]
            if (oldKey) {
              settings[oldKey] = String(value)
            }
          }
        }
      }
      
      flatten(settingsSection)
    }
    
    return settings
  }

  getCloudDriveSettings(): any {
    const settingsSection = this.getSection('Settings')
    let cloudDriveSettings = {
      quark: [],
      uc: [],
      cloud123: [],
      cloud115: [],
      xunlei: []
    }
    
    if (settingsSection && settingsSection.CloudDrive) {
      const rawSettings = settingsSection.CloudDrive
      
      // 确保每个属性都是数组
      for (const key of ['quark', 'uc', 'cloud123', 'cloud115', 'xunlei']) {
        if (rawSettings[key]) {
          // 如果是字符串，尝试解析为 JSON
          if (typeof rawSettings[key] === 'string') {
            try {
              const parsed = JSON.parse(rawSettings[key])
              cloudDriveSettings[key as keyof typeof cloudDriveSettings] = Array.isArray(parsed) ? parsed : []
            } catch {
              cloudDriveSettings[key as keyof typeof cloudDriveSettings] = []
            }
          } else if (Array.isArray(rawSettings[key])) {
            cloudDriveSettings[key as keyof typeof cloudDriveSettings] = rawSettings[key]
          } else {
            cloudDriveSettings[key as keyof typeof cloudDriveSettings] = []
          }
        }
      }
    }
    
    return cloudDriveSettings
  }

  setCloudDriveSettings(settings: any): void {
    const settingsSection = this.getSection('Settings') || {}
    settingsSection.CloudDrive = settings
    this.setSection('Settings', settingsSection)
  }

  // ========== 安装相关方法 ==========

  /**
   * 检查是否已安装
   */
  isInstalled(): boolean {
    return this.get('Application', 'Installed', false) as boolean
  }

  /**
   * 完成安装
   */
  completeInstallation(): void {
    this.set('Application', 'Installed', true)
    this.set('Application', 'InstalledAt', new Date().toISOString())
    this.set('Application', 'Version', '1.0.4')
    devLog('✅ 安装完成')
  }

  /**
   * 重置配置（恢复出厂设置）
   */
  resetConfig(): void {
    this.config = this.getDefaultConfig()
    this.saveConfig()
    devLog('✅ 配置已重置')
  }
}

// 创建全局配置管理器实例
export const configManager = new ConfigManager()

