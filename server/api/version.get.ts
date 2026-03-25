import { defineEventHandler } from 'h3'
import { readFileSync, existsSync } from 'fs'
import { join } from 'path'
import { devLog, devError } from '../utils/dev'

interface GitHubRelease {
  tag_name: string
  name: string
  published_at: string
  html_url: string
  body: string
}

export default defineEventHandler(async (event) => {
  let currentVersion = '1.0.6'
  let latestVersion = '1.0.6'
  let latestRelease: GitHubRelease | null = null
  let updateAvailable = false

  try {
    // 尝试从多个位置读取 package.json
    const cwd = process.cwd()
    const possiblePaths = [
      join(cwd, 'package.json'), // 当前目录
      join(cwd, '..', 'package.json'), // 上级目录（编译后的情况）
      join(cwd, '../..', 'package.json') // 再上一级
    ]

    let packageJson: any = null
    for (const packageJsonPath of possiblePaths) {
      try {
        if (existsSync(packageJsonPath)) {
          packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'))
          currentVersion = packageJson.version || '1.0.6'
          devLog('从以下路径读取版本:', packageJsonPath, currentVersion)
          break
        }
      } catch (e) {
        // 继续尝试下一个路径
        continue
      }
    }

    // 如果还是找不到，尝试从配置文件读取
    if (!packageJson) {
      try {
        const { configManager } = await import('../utils/config-manager')
        const appVersion = configManager.get('Application', 'Version', '1.0.6')
        currentVersion = String(appVersion)
        devLog('从配置文件读取版本:', currentVersion)
      } catch (e) {
        devLog('无法从配置文件读取版本，使用默认值')
      }
    }

    latestVersion = currentVersion

    // 获取 GitHub releases
    try {
      const response = await fetch('https://api.github.com/repos/MoviCloud-com/movicloud-app/releases/latest', {
        headers: {
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'MoviCloud-App'
        },
        signal: AbortSignal.timeout(10000) // 10秒超时
      })

      if (response.ok) {
        latestRelease = await response.json() as GitHubRelease
        latestVersion = latestRelease.tag_name.replace(/^v/, '') // 移除 'v' 前缀
        
        // 比较版本号
        if (compareVersions(latestVersion, currentVersion) > 0) {
          updateAvailable = true
        }
        devLog('GitHub releases 获取成功:', latestVersion)
      } else {
        devLog('无法获取 GitHub releases:', response.status, response.statusText)
      }
    } catch (error: any) {
      devError('获取 GitHub releases 失败:', error.message || error)
      // 如果获取失败，仍然返回当前版本信息
    }

    return {
      success: true,
      currentVersion,
      latestVersion,
      updateAvailable,
      latestRelease: latestRelease ? {
        tag_name: latestRelease.tag_name,
        name: latestRelease.name,
        published_at: latestRelease.published_at,
        html_url: latestRelease.html_url,
        body: latestRelease.body
      } : null
    }
  } catch (error: any) {
    devError('获取版本信息失败:', error.message || error)
    // 即使出错也返回当前版本信息
    return {
      success: true,
      currentVersion,
      latestVersion,
      updateAvailable: false,
      latestRelease: null
    }
  }
})

// 简单的版本号比较函数
function compareVersions(version1: string, version2: string): number {
  const v1Parts = version1.split('.').map(Number)
  const v2Parts = version2.split('.').map(Number)
  
  const maxLength = Math.max(v1Parts.length, v2Parts.length)
  
  for (let i = 0; i < maxLength; i++) {
    const v1Part = v1Parts[i] || 0
    const v2Part = v2Parts[i] || 0
    
    if (v1Part > v2Part) return 1
    if (v1Part < v2Part) return -1
  }
  
  return 0
}

