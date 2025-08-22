/**
 * 服务器端开发模式工具函数
 * 只在开发环境下执行console语句
 */

import { existsSync } from 'fs'
import { join } from 'path'

// 更灵活的环境检测逻辑
// 1. 检查是否存在 server/index.mjs（生产环境特征）
// 2. 检查是否存在 .nuxt 目录（开发环境特征）
// 3. 检查当前目录结构
function detectEnvironment(): boolean {
  const cwd = process.cwd()
  
  const hasServerIndex = existsSync(join(cwd, 'server', 'index.mjs'))
  const hasNuxtDir = existsSync(join(cwd, '.nuxt'))
  const hasPackageJson = existsSync(join(cwd, 'package.json'))
  const hasNodeModules = existsSync(join(cwd, 'node_modules'))
  
  // 生产环境：有 server/index.mjs，没有 .nuxt 目录
  // 开发环境：有 .nuxt 目录，有 package.json，有 node_modules
  const isProduction = hasServerIndex && !hasNuxtDir
  const isDevelopment = hasNuxtDir && hasPackageJson && hasNodeModules
  
  return isDevelopment
}

const isDev = detectEnvironment()

export const devLog = (...args: any[]) => {
  if (isDev) {
    console.log(...args)
  }
}

export const devError = (...args: any[]) => {
  if (isDev) {
    console.error(...args)
  }
}

export const devWarn = (...args: any[]) => {
  if (isDev) {
    console.warn(...args)
  }
}

export const devInfo = (...args: any[]) => {
  if (isDev) {
    console.info(...args)
  }
}

export const devDebug = (...args: any[]) => {
  if (isDev) {
    console.debug(...args)
  }
}

export const devGroup = (label: string) => {
  if (isDev) {
    console.group(label)
  }
}

export const devGroupEnd = () => {
  if (isDev) {
    console.groupEnd()
  }
}

export const devTable = (data: any) => {
  if (isDev) {
    console.table(data)
  }
}

export const devTime = (label: string) => {
  if (isDev) {
    console.time(label)
  }
}

export const devTimeEnd = (label: string) => {
  if (isDev) {
    console.timeEnd(label)
  }
} 