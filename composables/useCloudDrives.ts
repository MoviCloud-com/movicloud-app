import { computed } from 'vue'
import { t } from './useI18n'

export interface CloudDrive {
  id: string
  name: string
  code: string
  logo: string
  color: string
  domain: string
}

export interface MockResourceItem {
  id: string
  driveId: string
  driveCode: string
  link: string
  rating: number
  ratingCount: number
  fileSize: string
  fileSizeUnit: string
  resolution: string
  videoCodec: string
  audioCodec: string
  uploadTime: string
  uploader: string
  type: string
  typeName: string
}

export interface ResourceGroup {
  type: string
  typeName: string
  resources: MockResourceItem[]
}

export const useCloudDrives = () => {
  // 网盘基础配置
  const cloudDrives = computed<CloudDrive[]>(() => [
    {
      id: '115',
      name: t('115_cloud_drive'),
      code: '115',
      logo: 'https://is1-ssl.mzstatic.com/image/thumb/Purple211/v4/e0/e0/bb/e0e0bb24-8446-46e5-46d7-8f714f1604cd/AppIcon-0-0-1x_U007emarketing-0-7-0-0-sRGB-85-220.png/512x512bb.jpg',
      color: '#FF6B35',
      domain: '115.com'
    },
    {
      id: '123',
      name: t('123_cloud_drive'),
      code: '123',
      logo: 'https://is1-ssl.mzstatic.com/image/thumb/Purple211/v4/91/9b/8f/919b8f72-167f-3b87-7364-54e0cac3695b/AppIcon-0-0-1x_U007emarketing-0-7-0-85-220.png/512x512bb.jpg',
      color: '#4A90E2',
      domain: '123pan.com'
    },
    {
      id: 'uc',
      name: t('uc_cloud_drive'),
      code: 'uc',
      logo: 'https://is1-ssl.mzstatic.com/image/thumb/Purple221/v4/91/24/05/91240514-390a-4833-0a24-4667c3571c60/AppIcon-0-1x_U007emarketing-0-4-0-0-sRGB-85-220-0.png/512x512bb.jpg',
      color: '#FF6B6B',
      domain: 'drive.uc.cn'
    },
    {
      id: 'quark',
      name: t('quark_cloud_drive'),
      code: 'quark',
      logo: 'https://is1-ssl.mzstatic.com/image/thumb/Purple211/v4/6c/8c/ba/6c8cbaef-4db1-ea07-f035-b86bc72aad67/AppIcon-0-1x_U007emarketing-0-7-0-0-85-220-0.png/512x512bb.jpg',
      color: '#50C878',
      domain: 'pan.quark.cn'
    },
    {
      id: 'xunlei',
      name: t('xunlei_cloud_drive'),
      code: 'xunlei',
      logo: 'https://is1-ssl.mzstatic.com/image/thumb/Purple211/v4/40/c3/f3/40c3f340-da5f-ed7f-d234-f7794f75f5ce/AppIcon-0-0-1x_U007emarketing-0-7-0-85-220.png/512x512bb.jpg',
      color: '#FFD700',
      domain: 'pan.xunlei.com'
    }
  ])

  // 根据ID获取网盘信息
  const getDriveById = (id: string): CloudDrive | undefined => {
    return cloudDrives.value.find(drive => drive.id === id)
  }

  // 根据代号获取网盘信息
  const getDriveByCode = (code: string): CloudDrive | undefined => {
    return cloudDrives.value.find(drive => drive.code === code)
  }

  // 生成网盘链接
  const generateDriveLink = (driveCode: string, resourceId: string): string => {
    const drive = getDriveByCode(driveCode)
    if (!drive) return ''
    
    const linkMap: Record<string, string> = {
      '115': `https://115.com/s/${resourceId}`,
      '123': `https://www.123pan.com/s/${resourceId}`,
      'uc': `https://drive.uc.cn/s/${resourceId}`,
      'quark': `https://pan.quark.cn/s/${resourceId}`,
      'xunlei': `https://pan.xunlei.com/s/${resourceId}`
    }
    
    return linkMap[driveCode] || ''
  }

  // 模拟资源数据
  const mockResources = (mediaId: string, mediaType: 'movie' | 'tv'): any[] => {
    const resourceTypes = [
      { type: 'original', typeName: t('bluray_original') },
      { type: 'remux', typeName: t('lossless_remux') },
      { type: 'encode', typeName: t('high_quality_encode') },
      { type: 'web', typeName: t('web_version') }
    ]

    // 扁平化所有类型和所有网盘的资源
    const resources: any[] = []
    let idCounter = 1
    resourceTypes.forEach(({ type, typeName }) => {
      cloudDrives.value.forEach((drive, index) => {
        resources.push({
          id: idCounter,
          media_id: mediaId,
          media_type: mediaType,
          season_number: mediaType === 'tv' ? 1 : null,
          episode_number: null,
          resource_type: type,
          cloud_drive_code: drive.code,
          drive_link: generateDriveLink(drive.code, `${mediaId}_${type}_${index + 1}`),
          resolution: ['8k', '4k', '1080p', '1080i', '720p', 'sd'][Math.floor(Math.random() * 6)],
          file_size: `${(Math.random() * 50 + 10).toFixed(1)}GB`,
          video_codec: ['H.264', 'H.265', 'AV1'][Math.floor(Math.random() * 3)],
          audio_codec: ['AAC', 'AC3', 'DTS'][Math.floor(Math.random() * 3)],
          submitter_id: 'mock_user',
          status: 'approved',
          rating: Math.floor(Math.random() * 20 + 80) / 10, // 8.0-10.0
          rating_count: Math.floor(Math.random() * 500 + 50), // 50-550
          created_at: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
          updated_at: new Date().toISOString()
        })
        idCounter++
      })
    })
    return resources
  }

  return {
    cloudDrives,
    getDriveById,
    getDriveByCode,
    generateDriveLink,
    mockResources
  }
} 