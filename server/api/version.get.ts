import { defineEventHandler } from 'h3'
import { readFileSync } from 'fs'
import { join } from 'path'
import { devLog, devError } from '../../server/utils/dev'

interface GitHubRelease {
  tag_name: string
  name: string
  published_at: string
  html_url: string
  body: string
}

export default defineEventHandler(async (event) => {
  try {
    // 读取当前版本号
    const packageJsonPath = join(process.cwd(), 'package.json')
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'))
    const currentVersion = packageJson.version || '1.0.0'

    // 获取 GitHub releases
    let latestVersion = currentVersion
    let latestRelease: GitHubRelease | null = null
    let updateAvailable = false

    try {
      const response = await fetch('https://api.github.com/repos/MoviCloud-com/movicloud-app/releases/latest', {
        headers: {
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'MoviCloud-App'
        }
      })

      if (response.ok) {
        latestRelease = await response.json() as GitHubRelease
        latestVersion = latestRelease.tag_name.replace(/^v/, '') // 移除 'v' 前缀
        
        // 比较版本号
        if (compareVersions(latestVersion, currentVersion) > 0) {
          updateAvailable = true
        }
      } else {
        devLog('无法获取 GitHub releases:', response.status, response.statusText)
      }
    } catch (error) {
      devError('获取 GitHub releases 失败:', error)
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
  } catch (error) {
    devError('获取版本信息失败:', error)
    return {
      success: false,
      currentVersion: '1.0.0',
      latestVersion: '1.0.0',
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

