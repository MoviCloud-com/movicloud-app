import { useAuth } from './useAuth'

export interface UserProfile {
  id: string | number
  username: string
  nickname?: string
  email?: string
  avatar?: string
}

export const useUserProfile = () => {
  const { getToken } = useAuth()

  const getAuthHeaders = (): HeadersInit => {
    const token = getToken()
    if (!token) throw new Error('unauthorized')
    return { 'Authorization': `Bearer ${token}` }
  }

  const fetchProfile = async (): Promise<UserProfile> => {
    const res = await fetch('/api/user/profile', { headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' } })
    if (!res.ok) {
      if (res.status === 401) throw new Error('unauthorized')
      throw new Error('get_user_profile_failed')
    }
    return await res.json()
  }

  const uploadAvatar = async (file: File): Promise<{ avatar: string }> => {
    if (!file) throw new Error('please_select_avatar')
    const form = new FormData()
    form.append('avatar', file)
    const res = await fetch('/api/user/avatar', { method: 'POST', headers: getAuthHeaders(), body: form })
    if (!res.ok) throw new Error('failed_to_update_avatar')
    return await res.json()
  }

  const deleteAvatar = async (): Promise<void> => {
    const res = await fetch('/api/user/avatar', { method: 'DELETE', headers: getAuthHeaders() })
    if (!res.ok) throw new Error('clear_avatar_failed')
  }

  const putUsername = async (username: string): Promise<void> => {
    const res = await fetch('/api/user/username', { method: 'PUT', headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' }, body: JSON.stringify({ username }) })
    if (!res.ok) throw new Error('failed_to_update_username')
  }

  const putNickname = async (nickname: string): Promise<void> => {
    const res = await fetch('/api/user/nickname', { method: 'PUT', headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' }, body: JSON.stringify({ nickname }) })
    if (!res.ok) throw new Error('failed_to_update_nickname')
  }

  const putEmail = async (email: string): Promise<void> => {
    const res = await fetch('/api/user/email', { method: 'PUT', headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) })
    if (!res.ok) throw new Error('failed_to_update_email')
  }

  const putPassword = async (currentPassword: string, newPassword: string): Promise<void> => {
    const res = await fetch('/api/user/password', { method: 'PUT', headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' }, body: JSON.stringify({ currentPassword, newPassword }) })
    if (!res.ok) {
      try {
        const data = await res.json()
        throw new Error(data?.message || 'password_update_failed')
      } catch {
        throw new Error('password_update_failed')
      }
    }
  }

  return {
    fetchProfile,
    uploadAvatar,
    deleteAvatar,
    putUsername,
    putNickname,
    putEmail,
    putPassword
  }
} 