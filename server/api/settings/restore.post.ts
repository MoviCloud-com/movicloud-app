import { dbManager } from '../../database/database'
import { devLog, devError } from '../../utils/dev'
import { readMultipartFormData } from 'h3'
import { readFile } from 'fs/promises'
import { tmpdir } from 'os'
import { join } from 'path'
import { writeFile, unlink } from 'fs/promises'

export default defineEventHandler(async (event) => {
  try {
    const user = event.context.user
    if (!user || user.role !== 'admin') {
      throw createError({ statusCode: 403, statusMessage: 'forbidden_admin_only' })
    }

    // 获取上传的文件
    const formData = await readMultipartFormData(event)
    if (!formData) {
      throw createError({ statusCode: 400, statusMessage: 'no_file_uploaded' })
    }
    
    const fileData = formData.find(item => item.name === 'file')
    if (!fileData || !fileData.data) {
      throw createError({ statusCode: 400, statusMessage: 'no_file_uploaded' })
    }
    
    // 检查文件类型
    const filename = fileData.filename || ''
    if (!filename.endsWith('.json')) {
      throw createError({ statusCode: 400, statusMessage: 'invalid_backup_file_format' })
    }
    
    devLog('开始恢复数据库...')
    
    // 读取文件内容
    const fileContent = fileData.data.toString('utf-8')
    let backup: any
    
    try {
      backup = JSON.parse(fileContent)
    } catch (error) {
      throw createError({ statusCode: 400, statusMessage: 'invalid_backup_file_format' })
    }
    
    // 验证备份文件格式
    if (!backup.version || !backup.tables) {
      throw createError({ statusCode: 400, statusMessage: 'invalid_backup_file_format' })
    }
    
    // 获取数据库实例
    if (!dbManager['db']) {
      await dbManager['initialize']()
    }
    const db = dbManager['db']!
    
    // 开始事务
    await db.run('BEGIN TRANSACTION')
    
    try {
      // 恢复 users 表
      if (backup.tables.users && Array.isArray(backup.tables.users)) {
        // 先清空表并重置自增ID
        await db.run('DELETE FROM users')
        await db.run('DELETE FROM sqlite_sequence WHERE name = "users"')
        // 插入数据
        for (const user of backup.tables.users) {
          await db.run(
            'INSERT INTO users (id, username, nickname, password_hash, email, avatar, role, is_active, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [user.id, user.username, user.nickname, user.password_hash, user.email, user.avatar, user.role, user.is_active || 1, user.created_at, user.updated_at]
          )
        }
        devLog(`恢复了 ${backup.tables.users.length} 条用户记录`)
      }
      
      // 恢复 settings 表
      if (backup.tables.settings && Array.isArray(backup.tables.settings)) {
        // 先清空表并重置自增ID
        await db.run('DELETE FROM settings')
        await db.run('DELETE FROM sqlite_sequence WHERE name = "settings"')
        // 插入数据
        for (const setting of backup.tables.settings) {
          await db.run(
            'INSERT INTO settings (id, key, value, description, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)',
            [setting.id, setting.key, setting.value, setting.description || null, setting.created_at, setting.updated_at]
          )
        }
        devLog(`恢复了 ${backup.tables.settings.length} 条设置记录`)
      }
      
      // 恢复 installation 表
      if (backup.tables.installation && Array.isArray(backup.tables.installation)) {
        // 先清空表并重置自增ID
        await db.run('DELETE FROM installation')
        await db.run('DELETE FROM sqlite_sequence WHERE name = "installation"')
        // 插入数据
        for (const install of backup.tables.installation) {
          await db.run(
            'INSERT INTO installation (id, is_installed, installed_at, version, created_at) VALUES (?, ?, ?, ?, ?)',
            [install.id, install.is_installed || 0, install.installed_at, install.version, install.created_at]
          )
        }
        devLog(`恢复了 ${backup.tables.installation.length} 条安装记录`)
      }
      
      // 提交事务
      await db.run('COMMIT')
      
      devLog('数据库恢复完成')
      
      return { success: true, message: 'restore_success' }
    } catch (error) {
      // 回滚事务
      await db.run('ROLLBACK')
      throw error
    }
  } catch (error) {
    devError('恢复失败:', error)
    throw createError({ statusCode: 500, statusMessage: 'restore_failed' })
  }
})

