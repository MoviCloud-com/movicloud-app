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
      logo: '/images/cloud-drives/115.png',
      color: '#4064F6',
      domain: '115.com'
    },
    {
      id: '123',
      name: t('123_cloud_drive'),
      code: '123',
      logo: '/images/cloud-drives/123.png',
      color: '#4C6DFE',
      domain: '123pan.com'
    },
    {
      id: 'uc',
      name: t('uc_cloud_drive'),
      code: 'uc',
      logo: '/images/cloud-drives/uc.png',
      color: '#F56322',
      domain: 'drive.uc.cn'
    },
    {
      id: 'quark',
      name: t('quark_cloud_drive'),
      code: 'quark',
      logo: '/images/cloud-drives/quark.png',
      color: '#373BFE',
      domain: 'pan.quark.cn'
    },
    {
      id: 'xunlei',
      name: t('xunlei_cloud_drive'),
      code: 'xunlei',
      logo: '/images/cloud-drives/xunlei.png',
      color: '#4D73FE',
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