import { $fetch } from 'ofetch'
import { devLog, devError } from './dev'
import { configManager } from './config-manager'
import crypto from 'crypto'

const API_KEY = '16CCEB3D-AB42-077D-36A1-F355324E4237'

interface TrimeMediaConfig {
  host: string
  username: string
  password: string
}

interface TrimeMediaItem {
  guid: string
  type: 'Movie' | 'TV' | 'Season' | 'Episode' | 'Video' | 'Directory'
  title: string | null
  original_title: string | null
  release_date: string | null
  air_date: string | null
  trim_id: string | null
  tmdb_id: number | null
  season_number: number | null
  episode_number: number | null
}

interface TrimeMediaSearchResult {
  success: boolean
  items: TrimeMediaItem[]
  message?: string
}

interface TrimeMediaMediaExistsResult {
  exists: boolean
  itemGuid: string | null
  type: 'movie' | 'tv' | null
  playUrl: string | null
}

function getAuthx(apiPath: string, body: string | null): string {
  const nonce = Math.floor(Math.random() * 900000 + 100000).toString()
  const ts = Date.now().toString()
  
  const dataHash = crypto.createHash('md5').update(body || '').digest('hex')
  const signStr = `NDzZTVxnRKP8Z0jXg1VAMonaG8akvh_${apiPath}_${nonce}_${ts}_${dataHash}_${API_KEY}`
  const sign = crypto.createHash('md5').update(signStr).digest('hex')
  
  return `nonce=${nonce}&timestamp=${ts}&sign=${sign}`
}

async function login(host: string, username: string, password: string): Promise<string | null> {
  try {
    const apiPath = '/api/v1/login'
    const url = `${host}${apiPath}`
    const body = JSON.stringify({
      username,
      password,
      app_name: 'trimemedia-web'
    })
    
    const response = await $fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'authx': getAuthx(apiPath, body)
      },
      body
    }) as any
    
    if (response.code === 0 && response.data?.token) {
      return response.data.token
    }
    
    return null
  } catch (error) {
    devError('TrimeMedia login failed:', error)
    return null
  }
}

async function searchMedia(host: string, token: string, keywords: string): Promise<TrimeMediaItem[]> {
  try {
    const apiPath = '/api/v1/search/list'
    const url = `${host}${apiPath}?q=${encodeURIComponent(keywords)}`
    
    const response = await $fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': token,
        'authx': getAuthx(apiPath, null)
      }
    }) as any
    
    if (response.code === 0 && response.data) {
      return response.data.map((item: any) => ({
        guid: item.guid,
        type: item.type,
        title: item.title,
        original_title: item.original_title,
        release_date: item.release_date,
        air_date: item.air_date,
        trim_id: item.trim_id,
        tmdb_id: item.trim_id ? parseTmdbId(item.trim_id) : null,
        season_number: item.season_number,
        episode_number: item.episode_number
      }))
    }
    
    return []
  } catch (error) {
    devError('TrimeMedia search failed:', error)
    return []
  }
}

function parseTmdbId(trimId: string): number | null {
  if (!trimId) return null
  if (trimId.startsWith('tt') || trimId.startsWith('tm')) {
    const id = parseInt(trimId.substring(2))
    return isNaN(id) ? null : id
  }
  return null
}

export async function checkMediaExists(
  title: string,
  year: string | null,
  tmdbId: number | null,
  mediaType: 'movie' | 'tv'
): Promise<TrimeMediaMediaExistsResult> {
  const host = configManager.getSetting('trimedia_host')
  const username = configManager.getSetting('trimedia_username')
  const password = configManager.getSetting('trimedia_password')
  const enabled = configManager.getSetting('trimedia_enabled')
  
  if (!host || !username || !password || enabled !== 'true') {
    return { exists: false, itemGuid: null, type: null, playUrl: null }
  }
  
  try {
    const token = await login(host, username, password)
    if (!token) {
      devError('TrimeMedia login failed')
      return { exists: false, itemGuid: null, type: null, playUrl: null }
    }
    
    const items = await searchMedia(host, token, title)
    
    for (const item of items) {
      if (mediaType === 'movie' && item.type !== 'Movie') continue
      if (mediaType === 'tv' && item.type !== 'TV') continue
      
      if (tmdbId && item.tmdb_id === tmdbId) {
        const playUrl = mediaType === 'movie' 
          ? `${host}/video/${item.guid}` 
          : `${host}/tv/${item.guid}`
        return { exists: true, itemGuid: item.guid, type: mediaType, playUrl }
      }
      
      const titles = [item.title, item.original_title].filter(Boolean)
      if (titles.some(t => t && t.toLowerCase() === title.toLowerCase())) {
        const itemYear = item.release_date?.substring(0, 4) || item.air_date?.substring(0, 4)
        if (!year || itemYear === year) {
          const playUrl = mediaType === 'movie' 
            ? `${host}/video/${item.guid}` 
            : `${host}/tv/${item.guid}`
          return { exists: true, itemGuid: item.guid, type: mediaType, playUrl }
        }
      }
    }
    
    return { exists: false, itemGuid: null, type: null, playUrl: null }
  } catch (error) {
    devError('TrimeMedia check media exists failed:', error)
    return { exists: false, itemGuid: null, type: null, playUrl: null }
  }
}

export async function testConnection(host: string, username: string, password: string): Promise<{ success: boolean; message: string }> {
  try {
    const token = await login(host, username, password)
    if (token) {
      return { success: true, message: 'trimedia_connection_success' }
    }
    return { success: false, message: 'trimedia_login_failed' }
  } catch (error) {
    devError('TrimeMedia test connection failed:', error)
    return { success: false, message: 'trimedia_connection_failed' }
  }
}
