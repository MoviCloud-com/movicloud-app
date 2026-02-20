import { ref } from 'vue'
import { useToast } from 'primevue/usetoast'
import { t } from './useI18n'

export interface CloudFile {
  fid: string
  file_name: string
  path: string
  size: number
  ctime: number
  mtime: number
  dir: boolean
  download_url?: string
}

export interface CloudDriveAccount {
  id: string
  name: string
  cookie: string
  driveCode: string
}

export const useCloudFileManagement = () => {
  const toast = useToast()
  const loading = ref(false)
  const files = ref<CloudFile[]>([])
  const currentFid = ref('0')
  const currentPathName = ref('')
  const fidHistory = ref<{ fid: string; name: string }[]>([])

  const searchFiles = async (account: CloudDriveAccount, query: string) => {
    if (!query.trim()) return
    
    try {
      loading.value = true
      
      const apiPath = account.driveCode === 'uc'
        ? '/api/cloud-drive/uc/search'
        : '/api/cloud-drive/quark/search'
      
      const response = await $fetch<{ success: boolean; data?: { list: CloudFile[] }; message?: string }>(apiPath, {
        method: 'POST',
        body: {
          cookies: account.cookie,
          keyword: query
        }
      })
      
      if (response.success && response.data && response.data.list) {
        files.value = response.data.list
        currentFid.value = 'search'
        currentPathName.value = `搜索: ${query}`
      }
    } catch (err) {
      toast.add({
        severity: 'error',
        summary: t('error'),
        detail: t('search_failed'),
        life: 3000
      })
    } finally {
      loading.value = false
    }
  }

  const loadFiles = async (account: CloudDriveAccount, fid: string = '0'): Promise<CloudFile[]> => {
    try {
      loading.value = true
      
      const apiPath = account.driveCode === 'uc'
        ? '/api/cloud-drive/uc/list-files'
        : '/api/cloud-drive/quark/list-files'
      
      const response = await $fetch<{ success: boolean; data?: { list: CloudFile[] }; message?: string }>(apiPath, {
        method: 'POST',
        body: {
          cookies: account.cookie,
          dirFid: fid
        },
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      })
      
      if (response.success && response.data && response.data.list) {
        files.value = response.data.list
        currentFid.value = fid
        return response.data.list
      }
      return []
    } catch (err) {
      toast.add({
        severity: 'error',
        summary: t('error'),
        detail: t('load_files_failed'),
        life: 3000
      })
      return []
    } finally {
      loading.value = false
    }
  }

  const navigateToFolder = async (account: CloudDriveAccount, folder: CloudFile) => {
    if (!folder.dir) return
    
    fidHistory.value.push({
      fid: currentFid.value,
      name: currentPathName.value
    })
    
    await loadFiles(account, folder.fid)
    currentPathName.value = folder.file_name
  }

  const navigateBack = async (account: CloudDriveAccount) => {
    if (fidHistory.value.length === 0) return
    
    const lastFolder = fidHistory.value.pop()!
    await loadFiles(account, lastFolder.fid)
    currentPathName.value = lastFolder.name
  }

  const createFolder = async (account: CloudDriveAccount, folderName: string, parentFid: string = '0') => {
    try {
      loading.value = true
      
      const apiPath = account.driveCode === 'uc'
        ? '/api/cloud-drive/uc/create-folder'
        : '/api/cloud-drive/quark/create-folder'
      
      const response = await $fetch<{ success: boolean; message?: string }>(apiPath, {
        method: 'POST',
        body: {
          cookies: account.cookie,
          folderName,
          pdirFid: parentFid
        }
      })
      
      if (response.success) {
        toast.add({
          severity: 'success',
          summary: t('success'),
          detail: t('create_folder_success'),
          life: 3000
        })
        
        await new Promise(resolve => setTimeout(resolve, 500))
        await loadFiles(account, parentFid)
      }
    } catch (err) {
      toast.add({
        severity: 'error',
        summary: t('error'),
        detail: t('create_folder_failed'),
        life: 3000
      })
    } finally {
      loading.value = false
    }
  }

  const renameFile = async (account: CloudDriveAccount, fid: string, newName: string) => {
    try {
      loading.value = true
      
      const apiPath = account.driveCode === 'uc'
        ? '/api/cloud-drive/uc/rename-file'
        : '/api/cloud-drive/quark/rename-file'
      
      const response = await $fetch<{ success: boolean; message?: string }>(apiPath, {
        method: 'POST',
        body: {
          cookies: account.cookie,
          fid,
          newName
        }
      })
      
      if (response.success) {
        toast.add({
          severity: 'success',
          summary: t('success'),
          detail: t('rename_file_success'),
          life: 3000
        })
        
        await loadFiles(account, currentFid.value)
      }
    } catch (err) {
      toast.add({
        severity: 'error',
        summary: t('error'),
        detail: t('rename_file_failed'),
        life: 3000
      })
    } finally {
      loading.value = false
    }
  }

  const deleteFiles = async (account: CloudDriveAccount, fidList: string[]) => {
    try {
      loading.value = true
      
      const apiPath = account.driveCode === 'uc'
        ? '/api/cloud-drive/uc/delete-file'
        : '/api/cloud-drive/quark/delete-file'
      
      const response = await $fetch<{ success: boolean; message?: string }>(apiPath, {
        method: 'POST',
        body: {
          cookies: account.cookie,
          fidList
        }
      })
      
      if (response.success) {
        toast.add({
          severity: 'success',
          summary: t('success'),
          detail: t('delete_file_success'),
          life: 3000
        })
        
        await loadFiles(account, currentFid.value)
      }
    } catch (err) {
      toast.add({
        severity: 'error',
        summary: t('error'),
        detail: t('delete_file_failed'),
        life: 3000
      })
    } finally {
      loading.value = false
    }
  }

  const moveFile = async (account: CloudDriveAccount, srcFid: string, destFid: string) => {
    try {
      loading.value = true
      
      const apiPath = account.driveCode === 'uc'
        ? '/api/cloud-drive/uc/move-file'
        : '/api/cloud-drive/quark/move-file'
      
      const response = await $fetch<{ success: boolean; message?: string }>(apiPath, {
        method: 'POST',
        body: {
          cookies: account.cookie,
          srcFid,
          destFid
        }
      })
      
      if (response.success) {
        toast.add({
          severity: 'success',
          summary: t('success'),
          detail: t('move_file_success'),
          life: 3000
        })
        
        await loadFiles(account, currentFid.value)
      }
    } catch (err) {
      toast.add({
        severity: 'error',
        summary: t('error'),
        detail: t('move_file_failed'),
        life: 3000
      })
    } finally {
      loading.value = false
    }
  }

  const copyFile = async (account: CloudDriveAccount, srcFid: string, destFid: string) => {
    try {
      loading.value = true
      
      const apiPath = account.driveCode === 'uc'
        ? '/api/cloud-drive/uc/copy-file'
        : '/api/cloud-drive/quark/copy-file'
      
      const response = await $fetch<{ success: boolean; message?: string }>(apiPath, {
        method: 'POST',
        body: {
          cookies: account.cookie,
          srcFid,
          destFid
        }
      })
      
      if (response.success) {
        toast.add({
          severity: 'success',
          summary: t('success'),
          detail: t('copy_file_success'),
          life: 3000
        })
        
        await loadFiles(account, currentFid.value)
      }
    } catch (err) {
      toast.add({
        severity: 'error',
        summary: t('error'),
        detail: t('copy_file_failed'),
        life: 3000
      })
    } finally {
      loading.value = false
    }
  }

  const createShare = async (account: CloudDriveAccount, fid: string, passcode: string = '', expiredType: number = 1) => {
    try {
      loading.value = true
      
      const apiPath = account.driveCode === 'uc'
        ? '/api/cloud-drive/uc/create-share'
        : '/api/cloud-drive/quark/create-share'
      
      const response = await $fetch<{ success: boolean; data?: any; message?: string }>(apiPath, {
        method: 'POST',
        body: {
          cookies: account.cookie,
          fidList: [fid],
          passcode,
          expiredType
        }
      })
      
      if (response.success && response.data) {
        return {
          success: true,
          data: response.data
        }
      }
      
      return {
        success: false,
        message: response.message || t('create_share_failed')
      }
    } catch (err) {
      return {
        success: false,
        message: t('create_share_failed')
      }
    } finally {
      loading.value = false
    }
  }

  const getUserInfo = async (account: CloudDriveAccount) => {
    try {
      loading.value = true
      
      const apiPath = account.driveCode === 'uc'
        ? '/api/cloud-drive/uc/user-info'
        : '/api/cloud-drive/quark/user-info'
      
      const response = await $fetch<{ success: boolean; data?: any; message?: string }>(apiPath, {
        method: 'POST',
        body: {
          cookies: account.cookie
        }
      })
      
      if (response.success && response.data) {
        return {
          success: true,
          data: response.data
        }
      }
      
      return {
        success: false,
        message: response.message || t('get_user_info_failed')
      }
    } catch (err) {
      return {
        success: false,
        message: t('get_user_info_failed')
      }
    } finally {
      loading.value = false
    }
  }

  const getShareInfo = async (driveCode: string, shareUrl: string) => {
    try {
      loading.value = true
      
      const apiPath = driveCode === 'uc'
        ? '/api/cloud-drive/uc/get-share-info'
        : '/api/cloud-drive/quark/get-share-info'
      
      const response = await $fetch<{ success: boolean; data?: any; message?: string }>(apiPath, {
        method: 'POST',
        body: {
          text: shareUrl
        }
      })
      
      if (response.success && response.data) {
        return {
          success: true,
          data: response.data
        }
      }
      
      return {
        success: false,
        message: response.message || t('get_share_info_failed')
      }
    } catch (err) {
      return {
        success: false,
        message: t('get_share_info_failed')
      }
    } finally {
      loading.value = false
    }
  }

  const getShareStoken = async (account: CloudDriveAccount, pwdID: string, passcode: string = '') => {
    try {
      loading.value = true
      
      const apiPath = account.driveCode === 'uc'
        ? '/api/cloud-drive/uc/get-share-stoken'
        : '/api/cloud-drive/quark/get-share-stoken'
      
      const response = await $fetch<{ success: boolean; data?: any; message?: string }>(apiPath, {
        method: 'POST',
        body: {
          cookies: account.cookie,
          pwdID,
          passcode
        }
      })
      
      if (response.success && response.data) {
        return {
          success: true,
          data: response.data
        }
      }
      
      return {
        success: false,
        message: response.message || t('get_share_stoken_failed')
      }
    } catch (err) {
      return {
        success: false,
        message: t('get_share_stoken_failed')
      }
    } finally {
      loading.value = false
    }
  }

  const getShareList = async (account: CloudDriveAccount, pwdID: string, stoken: string, pdirFid: string = '0', page: number = 1, size: number = 100) => {
    try {
      loading.value = true
      
      const apiPath = account.driveCode === 'uc'
        ? '/api/cloud-drive/uc/get-share-list'
        : '/api/cloud-drive/quark/get-share-list'
      
      const response = await $fetch<{ success: boolean; data?: any; message?: string }>(apiPath, {
        method: 'POST',
        body: {
          cookies: account.cookie,
          pwdID,
          stoken,
          pdirFid,
          page,
          size
        }
      })
      
      if (response.success && response.data) {
        return {
          success: true,
          data: response.data
        }
      }
      
      return {
        success: false,
        message: response.message || t('get_share_list_failed')
      }
    } catch (err) {
      return {
        success: false,
        message: t('get_share_list_failed')
      }
    } finally {
      loading.value = false
    }
  }

  const saveShareFile = async (
    account: CloudDriveAccount,
    pwdID: string,
    stoken: string,
    fidList: string[] = [],
    shareTokenList: string[] = [],
    toPdirFid: string = '0',
    pdirSaveAll: boolean = true
  ) => {
    try {
      loading.value = true
      
      const apiPath = account.driveCode === 'uc'
        ? '/api/cloud-drive/uc/save-share-file'
        : '/api/cloud-drive/quark/save-share-file'
      
      const response = await $fetch<{ success: boolean; data?: any; message?: string }>(apiPath, {
        method: 'POST',
        body: {
          cookies: account.cookie,
          pwdID,
          stoken,
          fidList,
          shareTokenList,
          toPdirFid,
          pdirSaveAll
        }
      })
      
      if (response.success) {
        toast.add({
          severity: 'success',
          summary: t('success'),
          detail: t('save_share_file_success'),
          life: 3000
        })
        
        return {
          success: true,
          data: response.data
        }
      }
      
      return {
        success: false,
        message: response.message || t('save_share_file_failed')
      }
    } catch (err) {
      toast.add({
        severity: 'error',
        summary: t('error'),
        detail: t('save_share_file_failed'),
        life: 3000
      })
      return {
        success: false,
        message: t('save_share_file_failed')
      }
    } finally {
      loading.value = false
    }
  }

  return {
    loading,
    files,
    currentFid,
    currentPathName,
    fidHistory,
    searchFiles,
    loadFiles,
    navigateToFolder,
    navigateBack,
    createFolder,
    renameFile,
    deleteFiles,
    moveFile,
    copyFile,
    createShare,
    getUserInfo,
    getShareInfo,
    getShareStoken,
    getShareList,
    saveShareFile
  }
}
