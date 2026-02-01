import { configManager } from '../../utils/config-manager'
import { devLog, devError } from '../../utils/dev'
import { readMultipartFormData } from 'h3'

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
    
    devLog('开始恢复配置...')
    
    // 读取文件内容
    const fileContent = fileData.data.toString('utf-8')
    let backup: any
    
    try {
      backup = JSON.parse(fileContent)
    } catch (error) {
      throw createError({ statusCode: 400, statusMessage: 'invalid_backup_file_format' })
    }
    
    // 验证备份文件格式（支持新旧两种格式）
    const isOldFormat = backup.version && backup.tables
    const isNewFormat = backup.version && (backup.config || backup.settings || backup.users)
    
    if (!isOldFormat && !isNewFormat) {
      throw createError({ statusCode: 400, statusMessage: 'invalid_backup_file_format' })
    }
    
    try {
      if (isNewFormat) {
        // 新格式：直接恢复配置
        if (backup.config) {
          // 恢复整个配置
          for (const [section, data] of Object.entries(backup.config)) {
            configManager.setSection(section, data as any)
          }
          devLog('恢复了配置数据')
        }
        
        // 恢复设置（兼容性）
        if (backup.settings) {
          for (const [key, value] of Object.entries(backup.settings)) {
            configManager.setSetting(key, value as string)
          }
          devLog('恢复了设置数据')
        }
        
        // 恢复用户（需要特殊处理，因为用户存储格式不同）
        if (backup.users && Array.isArray(backup.users)) {
          // 注意：用户恢复需要重新创建，因为密码哈希不能直接恢复
          devLog(`备份文件包含 ${backup.users.length} 个用户，但用户数据需要手动重新创建`)
        }
      } else if (isOldFormat) {
        // 旧格式：从数据库备份迁移到配置文件
        // 恢复 settings
        if (backup.tables.settings && Array.isArray(backup.tables.settings)) {
          for (const setting of backup.tables.settings) {
            configManager.setSetting(setting.key, setting.value)
          }
          devLog(`恢复了 ${backup.tables.settings.length} 条设置记录`)
        }
        
        // 恢复 installation
        if (backup.tables.installation && Array.isArray(backup.tables.installation)) {
          const install = backup.tables.installation[0]
          if (install) {
            configManager.set('Application', 'Installed', install.is_installed || false)
            configManager.set('Application', 'InstalledAt', install.installed_at || '')
            configManager.set('Application', 'Version', install.version || '1.0.3')
          }
          devLog('恢复了安装状态')
        }
        
        // 用户数据需要手动处理（密码哈希不能直接恢复）
        if (backup.tables.users && Array.isArray(backup.tables.users)) {
          devLog(`备份文件包含 ${backup.tables.users.length} 个用户，但用户数据需要手动重新创建`)
        }
      }
      
      devLog('配置恢复完成')
      
      return { success: true, message: 'restore_success' }
    } catch (error) {
      devError('恢复失败:', error)
      throw error
    }
  } catch (error) {
    devError('恢复失败:', error)
    throw createError({ statusCode: 500, statusMessage: 'restore_failed' })
  }
})

