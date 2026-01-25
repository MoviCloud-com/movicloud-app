import { dbManager } from '../../database/database'
import { devLog, devError } from '../../utils/dev'

export default defineEventHandler(async (event) => {
  try {
    const user = event.context.user
    if (!user || user.role !== 'admin') {
      throw createError({ statusCode: 403, statusMessage: 'forbidden_admin_only' })
    }

    devLog('开始备份数据库...')
    
    // 获取数据库实例
    if (!dbManager['db']) {
      await dbManager['initialize']()
    }
    const db = dbManager['db']!
    
    // 导出所有表的数据
    const backup: any = {
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      tables: {}
    }
    
    // 导出 users 表
    const users = await db.all('SELECT * FROM users')
    backup.tables.users = users
    
    // 导出 settings 表
    const settings = await db.all('SELECT * FROM settings')
    backup.tables.settings = settings
    
    // 导出 installation 表
    const installation = await db.all('SELECT * FROM installation')
    backup.tables.installation = installation
    
    devLog('数据库备份完成')
    
    // 设置响应头，返回JSON文件
    setHeader(event, 'Content-Type', 'application/json; charset=utf-8')
    setHeader(event, 'Content-Disposition', `attachment; filename="movicloud-backup-${new Date().toISOString().split('T')[0]}.json"`)
    
    return backup
  } catch (error) {
    devError('备份失败:', error)
    throw createError({ statusCode: 500, statusMessage: 'backup_failed' })
  }
})

