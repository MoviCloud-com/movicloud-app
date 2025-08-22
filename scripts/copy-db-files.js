import { copyFileSync, mkdirSync, existsSync } from 'fs'
import { join } from 'path'

// 复制数据库相关文件到 .output 目录
function copyDatabaseFiles() {
  const sourceDir = process.cwd()
  const outputDir = join(sourceDir, '.output')
  
  try {
    // 创建必要的目录
    const dbDir = join(outputDir, 'data')
    const serverDbDir = join(outputDir, 'server', 'database')
    
    if (!existsSync(dbDir)) {
      mkdirSync(dbDir, { recursive: true })
      console.log('✅ 已创建 .output/data 目录')
    }
    
    if (!existsSync(serverDbDir)) {
      mkdirSync(serverDbDir, { recursive: true })
      console.log('✅ 已创建 .output/server/database 目录')
    }
    
    // 复制 schema.sql 文件
    const schemaSource = join(sourceDir, 'server', 'database', 'schema.sql')
    const schemaDest = join(outputDir, 'server', 'database', 'schema.sql')
    
    if (existsSync(schemaSource)) {
      copyFileSync(schemaSource, schemaDest)
      console.log('✅ 已复制 schema.sql 到 .output/server/database/')
    } else {
      console.log('❌ schema.sql 文件不存在:', schemaSource)
    }
    
    console.log('✅ 数据库文件复制完成')
    console.log('📁 生产环境数据库将创建在: .output/data/movicloud.db')
  } catch (error) {
    console.error('❌ 复制数据库文件失败:', error)
  }
}

// 如果直接运行此脚本
if (import.meta.url === `file://${process.argv[1]}`) {
  copyDatabaseFiles()
}

export { copyDatabaseFiles } 