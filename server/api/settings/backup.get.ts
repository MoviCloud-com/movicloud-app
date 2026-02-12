import { configManager } from '../../utils/config-manager'
import { devLog, devError } from '../../utils/dev'

export default defineEventHandler(async (event) => {
  try {
    const user = event.context.user
    if (!user || user.role !== 'admin') {
      throw createError({ statusCode: 403, statusMessage: 'forbidden_admin_only' })
    }

    devLog('开始备份配置...')
    
    // 导出所有配置数据
    const backup: any = {
      version: '1.0.4',
      timestamp: new Date().toISOString(),
      config: configManager.getAll()
    }
    
    devLog('配置备份完成')
    
    // 设置响应头，返回JSON文件
    setHeader(event, 'Content-Type', 'application/json; charset=utf-8')
    setHeader(event, 'Content-Disposition', `attachment; filename="movicloud-backup-${new Date().toISOString().split('T')[0]}.json"`)
    
    return backup
  } catch (error) {
    devError('备份失败:', error)
    throw createError({ statusCode: 500, statusMessage: 'backup_failed' })
  }
})

