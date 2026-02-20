import { existsSync, mkdirSync } from 'fs'
import { join } from 'path'
import { homedir } from 'os'
import { devLog } from './dev'

let cachedDataDir: string | null = null

function getElectronUserDataDir(): string | null {
  try {
    if (typeof require === 'function') {
      const electron = require('electron')
      if (electron && electron.app) {
        return electron.app.getPath('userData')
      }
    }
  } catch {
    // Electron 不可用
  }
  return null
}

function isElectronEnvironment(): boolean {
  return !!process.env.ELECTRON_RUN_AS_NODE || 
         !!process.versions.electron ||
         getElectronUserDataDir() !== null
}

export function getDataDir(): string {
  if (cachedDataDir) {
    return cachedDataDir
  }
  
  if (process.env.MOV_DATA_DIR) {
    cachedDataDir = process.env.MOV_DATA_DIR
    if (!existsSync(cachedDataDir)) {
      mkdirSync(cachedDataDir, { recursive: true })
    }
    devLog('📁 使用环境变量数据目录:', cachedDataDir)
    return cachedDataDir
  }
  
  const electronUserData = getElectronUserDataDir()
  if (electronUserData) {
    const dataDir = join(electronUserData, 'data')
    if (!existsSync(dataDir)) {
      mkdirSync(dataDir, { recursive: true })
    }
    cachedDataDir = dataDir
    devLog('📁 使用 Electron 用户数据目录:', dataDir)
    return dataDir
  }
  
  const cwd = process.cwd()
  
  const hasServerIndex = existsSync(join(cwd, 'server', 'index.mjs'))
  const hasNuxtDir = existsSync(join(cwd, '.nuxt'))
  const hasPackageJson = existsSync(join(cwd, 'package.json'))
  const hasNodeModules = existsSync(join(cwd, 'node_modules'))
  
  const isProduction = hasServerIndex && !hasNuxtDir
  const isDevelopment = hasNuxtDir && hasPackageJson && hasNodeModules
  
  devLog('🔧 数据目录检测:')
  devLog('  - 工作目录:', cwd)
  devLog('  - 是否生产环境:', isProduction)
  devLog('  - 是否开发环境:', isDevelopment)
  
  let dataDir: string
  
  if (isProduction && isElectronEnvironment()) {
    const appName = 'MoviCloud'
    let userDataDir: string
    
    if (process.platform === 'darwin') {
      userDataDir = join(homedir(), 'Library', 'Application Support', appName)
    } else if (process.platform === 'win32') {
      userDataDir = join(process.env.APPDATA || join(homedir(), 'AppData', 'Roaming'), appName)
    } else {
      userDataDir = join(homedir(), '.config', appName)
    }
    
    dataDir = join(userDataDir, 'data')
  } else if (isProduction) {
    dataDir = join(cwd, 'data')
  } else {
    dataDir = join(cwd, 'data')
  }
  
  if (!existsSync(dataDir)) {
    mkdirSync(dataDir, { recursive: true })
    devLog('📁 创建数据目录:', dataDir)
  }
  
  cachedDataDir = dataDir
  return dataDir
}

export function getUploadsDir(subPath: string = ''): string {
  const dataDir = getDataDir()
  const uploadsDir = join(dataDir, 'uploads', subPath)
  
  if (!existsSync(uploadsDir)) {
    mkdirSync(uploadsDir, { recursive: true })
  }
  
  return uploadsDir
}
