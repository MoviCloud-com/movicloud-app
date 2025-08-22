import sqlite3 from 'sqlite3'
import { open, Database } from 'sqlite'
import { existsSync, readFileSync } from 'fs'
import { join } from 'path'
import bcrypt from 'bcrypt'
import { devLog, devError } from '../utils/dev'

export class DatabaseManager {
  private db: Database | null = null
  private dbPath: string
  private schemaPath: string

  constructor() {
    // 数据库文件路径：根据环境确定路径
    const cwd = process.cwd()
    
    // 更灵活的环境检测逻辑
    // 1. 检查是否存在 server/index.mjs（生产环境特征）
    // 2. 检查是否存在 .nuxt 目录（开发环境特征）
    // 3. 检查当前目录结构
    
    const hasServerIndex = existsSync(join(cwd, 'server', 'index.mjs'))
    const hasNuxtDir = existsSync(join(cwd, '.nuxt'))
    const hasPackageJson = existsSync(join(cwd, 'package.json'))
    const hasNodeModules = existsSync(join(cwd, 'node_modules'))
    
    // 生产环境：有 server/index.mjs，没有 .nuxt 目录
    // 开发环境：有 .nuxt 目录，有 package.json，有 node_modules
    const isProduction = hasServerIndex && !hasNuxtDir
    const isDevelopment = hasNuxtDir && hasPackageJson && hasNodeModules
    
    devLog('🔧 当前工作目录:', cwd)
    devLog('🔧 环境检测结果:')
    devLog('  - 存在 server/index.mjs:', hasServerIndex)
    devLog('  - 存在 .nuxt 目录:', hasNuxtDir)
    devLog('  - 存在 package.json:', hasPackageJson)
    devLog('  - 存在 node_modules:', hasNodeModules)
    devLog('  - 是否生产环境:', isProduction)
    devLog('  - 是否开发环境:', isDevelopment)
    
    if (isProduction) {
      // 生产环境：数据库文件在当前目录的 data 文件夹下
      this.dbPath = join(cwd, 'data', 'movicloud.db')
      this.schemaPath = join(cwd, 'server', 'database', 'schema.sql')
      devLog('🔧 生产环境 - 数据库路径:', this.dbPath)
      devLog('🔧 生产环境 - Schema路径:', this.schemaPath)
    } else {
      // 开发环境：数据库文件在项目根目录的 data 文件夹下
      this.dbPath = join(cwd, 'data', 'movicloud.db')
      this.schemaPath = join(cwd, 'server', 'database', 'schema.sql')
      devLog('🔧 开发环境 - 数据库路径:', this.dbPath)
      devLog('🔧 开发环境 - Schema路径:', this.schemaPath)
    }
  }

  // 初始化数据库
  async initialize(): Promise<void> {
    try {
      // 检查数据库是否已存在
      const { existsSync } = await import('fs')
      const dbExists = existsSync(this.dbPath)
      
      devLog('🔍 检查数据库是否存在:', this.dbPath)
      devLog('🔍 数据库存在状态:', dbExists)
      
      // 确保数据目录存在
      const { mkdir } = await import('fs/promises')
      const { dirname } = await import('path')
      await mkdir(dirname(this.dbPath), { recursive: true })

      // 打开数据库连接
      this.db = await open({
        filename: this.dbPath,
        driver: sqlite3.Database
      })

      // 只在数据库不存在时才执行初始化
      if (!dbExists) {
        devLog('📝 数据库不存在，开始初始化...')
        
        // 检查schema文件是否存在
        if (!existsSync(this.schemaPath)) {
          throw new Error(`Schema文件不存在: ${this.schemaPath}`)
        }
        
        // 读取并执行schema.sql
        const schema = readFileSync(this.schemaPath, 'utf-8')
        
        // 执行SQL语句
        const statements = schema.split(';').filter(stmt => stmt.trim())
        devLog(`📝 准备执行 ${statements.length} 条SQL语句`)
        for (const statement of statements) {
          if (statement.trim()) {
            devLog('📝 执行SQL:', statement.trim().substring(0, 50) + '...')
            await this.db.exec(statement)
          }
        }

        devLog('✅ 数据库初始化完成')
      } else {
        devLog('✅ 数据库已存在，跳过初始化')
      }
    } catch (error) {
      devError('❌ 数据库初始化失败:', error)
      throw error
    }
  }

  // 检查是否已安装
  async isInstalled(): Promise<boolean> {
    if (!this.db) {
      await this.initialize()
    }
    
    const result = await this.db!.get('SELECT is_installed FROM installation LIMIT 1')
    return result?.is_installed === 1
  }

  // 获取设置
  async getSetting(key: string): Promise<string | null> {
    if (!this.db) {
      await this.initialize()
    }
    
    const result = await this.db!.get('SELECT value FROM settings WHERE key = ?', [key])
    return result?.value || null
  }

  // 设置设置
  async setSetting(key: string, value: string): Promise<void> {
    if (!this.db) {
      await this.initialize()
    }
    
    await this.db!.run(
      'INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)',
      [key, value]
    )
  }

  // 获取所有设置
  async getAllSettings(): Promise<Record<string, string>> {
    if (!this.db) {
      await this.initialize()
    }
    
    const results = await this.db!.all('SELECT key, value FROM settings')
    const settings: Record<string, string> = {}
    for (const row of results) {
      settings[row.key] = row.value
    }
    return settings
  }

  // 创建用户
  async createUser(username: string, password: string, nickname?: string, role: 'admin' | 'user' = 'user'): Promise<void> {
    if (!this.db) {
      await this.initialize()
    }
    
    const passwordHash = await bcrypt.hash(password, 10)
    
    await this.db!.run(
      'INSERT INTO users (username, nickname, password_hash, role, created_at, updated_at) VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)',
      [username, nickname || username, passwordHash, role]
    )
  }

  // 验证用户
  async verifyUser(username: string, password: string): Promise<boolean> {
    if (!this.db) {
      await this.initialize()
    }
    
    const user = await this.db!.get('SELECT password_hash FROM users WHERE username = ? AND is_active = 1', [username])
    if (!user) return false
    
    return bcrypt.compare(password, user.password_hash)
  }

  // 获取用户信息
  async getUser(username: string): Promise<any> {
    if (!this.db) {
      await this.initialize()
    }
    
    return await this.db!.get('SELECT id, username, nickname, email, avatar, role, created_at FROM users WHERE username = ? AND is_active = 1', [username])
  }

  // 根据ID获取用户信息
  async getUserById(id: string): Promise<any> {
    if (!this.db) {
      await this.initialize()
    }
    
    return await this.db!.get('SELECT id, username, nickname, email, avatar, role, created_at FROM users WHERE id = ? AND is_active = 1', [id])
  }

  // 更新用户昵称
  async updateUserNickname(userId: string, nickname: string): Promise<void> {
    if (!this.db) {
      await this.initialize()
    }
    
    await this.db!.run(
      'UPDATE users SET nickname = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND is_active = 1',
      [nickname, userId]
    )
  }

  // 更新用户名
  async updateUserUsername(userId: string, username: string): Promise<void> {
    if (!this.db) {
      await this.initialize()
    }
    
    await this.db!.run(
      'UPDATE users SET username = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND is_active = 1',
      [username, userId]
    )
  }

  // 更新用户邮箱
  async updateUserEmail(userId: string, email: string): Promise<void> {
    if (!this.db) {
      await this.initialize()
    }
    
    await this.db!.run(
      'UPDATE users SET email = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND is_active = 1',
      [email, userId]
    )
  }

  // 更新用户头像
  async updateUserAvatar(userId: string, avatar: string): Promise<void> {
    if (!this.db) {
      await this.initialize()
    }
    
    await this.db!.run(
      'UPDATE users SET avatar = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND is_active = 1',
      [avatar, userId]
    )
  }

  // 更新用户密码
  async updateUserPassword(userId: string, newPassword: string): Promise<void> {
    if (!this.db) {
      await this.initialize()
    }
    
    const passwordHash = await bcrypt.hash(newPassword, 10)
    
    await this.db!.run(
      'UPDATE users SET password_hash = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND is_active = 1',
      [passwordHash, userId]
    )
  }

  // 验证用户密码
  async verifyUserPassword(userId: string, currentPassword: string): Promise<boolean> {
    if (!this.db) {
      await this.db!.get('SELECT password_hash FROM users WHERE id = ? AND is_active = 1', [userId])
    }
    
    const user = await this.db!.get('SELECT password_hash FROM users WHERE id = ? AND is_active = 1', [userId])
    if (!user) return false
    
    return bcrypt.compare(currentPassword, user.password_hash)
  }

  // 检查是否有管理员用户
  async hasAdminUser(): Promise<boolean> {
    if (!this.db) {
      await this.initialize()
    }
    
    const result = await this.db!.get('SELECT COUNT(*) as count FROM users WHERE role = "admin" AND is_active = 1')
    return result?.count > 0
  }

  // 完成安装
  async completeInstallation(): Promise<void> {
    if (!this.db) {
      await this.initialize()
    }
    
    devLog('开始完成安装...')
    
    // 检查是否已经有安装记录
    const existingRecord = await this.db!.get('SELECT id FROM installation WHERE id = 1')
    
    if (existingRecord) {
      // 如果记录存在，更新它
      await this.db!.run(
        'UPDATE installation SET is_installed = 1, installed_at = CURRENT_TIMESTAMP, version = "1.0.0" WHERE id = 1'
      )
      devLog('更新现有安装记录')
    } else {
      // 如果记录不存在，创建新记录
      await this.db!.run(
        'INSERT INTO installation (id, is_installed, installed_at, version) VALUES (1, 1, CURRENT_TIMESTAMP, "1.0.0")'
      )
      devLog('创建新的安装记录')
    }
    
    devLog('安装完成，installation表已更新')
  }

  // 测试TMDB API连接
  async testTMDBConnection(apiKey: string, baseUrl?: string): Promise<boolean> {
    try {
      const url = baseUrl || 'https://api.tmdb.org/3'
      const response = await fetch(`${url}/configuration?api_key=${apiKey}`)
      return response.ok
    } catch (error) {
      devError('TMDB API连接测试失败:', error)
      return false
    }
  }

  // 重置数据库（恢复出厂设置）
  async resetDatabase(): Promise<void> {
    if (!this.db) {
      await this.initialize()
    }
    
    devLog('开始重置数据库...')
    
    // 删除所有表数据
    await this.db!.run('DELETE FROM users')
    await this.db!.run('DELETE FROM settings')
    await this.db!.run('UPDATE installation SET is_installed = 0, installed_at = NULL WHERE id = 1')
    
    devLog('数据库重置完成')
  }

  // 关闭数据库连接
  async close(): Promise<void> {
    if (this.db) {
      await this.db.close()
      this.db = null
    }
  }
}

// 创建全局数据库管理器实例
export const dbManager = new DatabaseManager() 