
import { computed } from 'vue'
import { t } from './useI18n'

export interface MediaInfoItem {
  code: string
  label: string
  description?: string
}

export const useMediaInfo = () => {
  // 资源类型定义
  const resourceTypes = computed<MediaInfoItem[]>(() => [
    { code: 'original', label: t('bluray_original'), description: t('bluray_original_desc') },
    { code: 'remux', label: t('lossless_remux'), description: t('lossless_remux_desc') },
    { code: 'encode', label: t('high_quality_encode'), description: t('high_quality_encode_desc') },
    { code: 'web', label: t('web_version'), description: t('web_version_desc') }
  ])

  // 分辨率定义
  const resolutions = computed<MediaInfoItem[]>(() => [
    { code: '8k', label: '8K' },
    { code: '4k', label: '4K' },
    { code: '1080p', label: '1080p' },
    { code: '1080i', label: '1080i' },
    { code: '720p', label: '720p' },
    { code: 'sd', label: 'SD' }
  ])

  // 视频编码定义
  const videoCodecs = computed<MediaInfoItem[]>(() => [
    { code: 'h264', label: 'H.264(x264/AVC)' },
    { code: 'h265', label: 'H.265(x265/HEVC)' },
    { code: 'vc1', label: 'VC-1' },
    { code: 'mpeg2', label: 'MPEG-2' },
    { code: 'xvid', label: 'Xvid' },
    { code: 'av1', label: 'AV1' },
    { code: 'vp8', label: 'VP8/9' },
    { code: 'avs', label: 'AVS' }
  ])

  // 音频编码定义
  const audioCodecs = computed<MediaInfoItem[]>(() => [
    { code: 'aac', label: 'AAC' },
    { code: 'ac3', label: 'AC3(DD)' },
    { code: 'dts', label: 'DTS' },
    { code: 'dtshd', label: 'DTS-HD MA' },
    { code: 'eac3', label: 'E-AC3(DDP)' },
    { code: 'eac3atoms', label: 'E-AC3 Atoms(DDP Atoms)' },
    { code: 'truehd', label: 'TrueHD' },
    { code: 'truehdatoms', label: 'TrueHD Atoms' }
  ])

  // 获取资源类型标签
  const getResourceTypeByCode = (code?: string): MediaInfoItem | undefined => {
    if (!code) return undefined
    return resourceTypes.value.find(item => item.code.toLowerCase() === code.toLowerCase())
  }

  // 获取分辨率标签
  const getResolutionByCode = (code?: string): MediaInfoItem | undefined => {
    if (!code) return undefined
    return resolutions.value.find(item => item.code.toLowerCase() === code.toLowerCase())
  }

  // 获取视频编码标签
  const getVideoCodecByCode = (code?: string): MediaInfoItem | undefined => {
    if (!code) return undefined
    return videoCodecs.value.find(item => item.code.toLowerCase() === code.toLowerCase())
  }

  // 获取音频编码标签
  const getAudioCodecByCode = (code?: string): MediaInfoItem | undefined => {
    if (!code) return undefined
    return audioCodecs.value.find(item => item.code.toLowerCase() === code.toLowerCase())
  }

  return {
    resourceTypes,
    resolutions,
    videoCodecs,
    audioCodecs,
    getResourceTypeByCode,
    getResolutionByCode,
    getVideoCodecByCode,
    getAudioCodecByCode
  }
}
