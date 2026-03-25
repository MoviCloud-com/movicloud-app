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
  cookie?: string
  refreshToken?: string
  captchaUserId?: string
  driveCode: string
}

export const useCloudFileManagement = () => {
  const toast = useToast()
  const loading = ref(false)
  const files = ref<CloudFile[]>([])
  const currentFid = ref('0')
  const currentPathName = ref('')
  const fidHistory = ref<{ fid: string; name: string }[]>([])

  const convertThunderFile = (file: any): CloudFile => {
    return {
      fid: file.id,
      file_name: file.name,
      path: '',
      size: file.size ? parseInt(file.size) : 0,
      ctime: file.created_time ? new Date(file.created_time).getTime() : 0,
      mtime: file.modified_time ? new Date(file.modified_time).getTime() : 0,
      dir: file.kind === 'drive#folder'
    }
  }

  const searchFiles = async (account: CloudDriveAccount, query: string) => {
    if (!query.trim()) return
    
    try {
      loading.value = true
      
      let apiPath: string
      let body: any
      
      if (account.driveCode === 'xunlei') {
        apiPath = '/api/cloud-drive/thunder/search'
        body = {
          refreshToken: account.refreshToken,
          captchaUserId: account.captchaUserId,
          keyword: query
        }
      } else {
        apiPath = account.driveCode === 'uc'
          ? '/api/cloud-drive/uc/search'
          : '/api/cloud-drive/quark/search'
        body = {
          cookies: account.cookie,
          keyword: query
        }
      }
      
      const response = await $fetch<{ success: boolean; data?: any; message?: string }>(apiPath, {
        method: 'POST',
        body
      })
      
      if (response.success && response.data) {
        if (account.driveCode === 'xunlei') {
          // 处理迅雷网盘搜索结果
          if (response.data.items) {
            files.value = response.data.items.map((file: any) => convertThunderFile(file))
          }
        } else {
          // 处理夸克/UC网盘搜索结果
          if (response.data.list) {
            files.value = response.data.list
          }
        }
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
      
      let apiPath: string
      let body: any
      
      if (account.driveCode === 'xunlei') {
        apiPath = '/api/cloud-drive/thunder/list-files'
        body = {
          refreshToken: account.refreshToken,
          captchaUserId: account.captchaUserId,
          parentId: fid === '0' ? '' : fid
        }
      } else {
        apiPath = account.driveCode === 'uc'
          ? '/api/cloud-drive/uc/list-files'
          : '/api/cloud-drive/quark/list-files'
        body = {
          cookies: account.cookie,
          dirFid: fid
        }
      }
      
      const response = await $fetch<{ success: boolean; data?: any; message?: string }>(apiPath, {
        method: 'POST',
        body,
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      })
      
      if (response.success && response.data) {
        if (account.driveCode === 'xunlei') {
          // 处理迅雷网盘文件列表
          if (response.data.list && Array.isArray(response.data.list)) {
            files.value = response.data.list
          }
        } else {
          // 处理夸克/UC网盘文件列表
          if (response.data.list) {
            files.value = response.data.list
          }
        }
        currentFid.value = fid
        return files.value
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
      
      let apiPath: string
      let body: any
      
      if (account.driveCode === 'xunlei') {
        apiPath = '/api/cloud-drive/thunder/create-folder'
        body = {
          refreshToken: account.refreshToken,
          captchaUserId: account.captchaUserId,
          folderName,
          pdirFid: parentFid === '0' ? '' : parentFid
        }
      } else {
        apiPath = account.driveCode === 'uc'
          ? '/api/cloud-drive/uc/create-folder'
          : '/api/cloud-drive/quark/create-folder'
        body = {
          cookies: account.cookie,
          folderName,
          pdirFid: parentFid
        }
      }
      
      const response = await $fetch<{ success: boolean; message?: string }>(apiPath, {
        method: 'POST',
        body
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
      
      let apiPath: string
      let body: any
      
      if (account.driveCode === 'xunlei') {
        apiPath = '/api/cloud-drive/thunder/rename-file'
        body = {
          refreshToken: account.refreshToken,
          captchaUserId: account.captchaUserId,
          fileId: fid,
          newName
        }
      } else {
        apiPath = account.driveCode === 'uc'
          ? '/api/cloud-drive/uc/rename-file'
          : '/api/cloud-drive/quark/rename-file'
        body = {
          cookies: account.cookie,
          fid,
          newName
        }
      }
      
      const response = await $fetch<{ success: boolean; message?: string }>(apiPath, {
        method: 'POST',
        body
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
      
      if (account.driveCode === 'xunlei') {
        // 迅雷网盘一次只能删除一个文件
        for (const fid of fidList) {
          const response = await $fetch<{ success: boolean; message?: string }>('/api/cloud-drive/thunder/delete-file', {
            method: 'POST',
            body: {
              refreshToken: account.refreshToken,
              captchaUserId: account.captchaUserId,
              fileId: fid
            }
          })
          
          if (!response.success) {
            throw new Error(response.message || '删除文件失败')
          }
        }
      } else {
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
        
        if (!response.success) {
          throw new Error(response.message || '删除文件失败')
        }
      }
      
      toast.add({
        severity: 'success',
        summary: t('success'),
        detail: t('delete_file_success'),
        life: 3000
      })
      
      await loadFiles(account, currentFid.value)
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
      
      let apiPath: string
      let body: any
      
      if (account.driveCode === 'xunlei') {
        apiPath = '/api/cloud-drive/thunder/move-file'
        body = {
          refreshToken: account.refreshToken,
          captchaUserId: account.captchaUserId,
          fileIds: [srcFid],
          parentId: destFid === '0' ? '' : destFid
        }
      } else {
        apiPath = account.driveCode === 'uc'
          ? '/api/cloud-drive/uc/move-file'
          : '/api/cloud-drive/quark/move-file'
        body = {
          cookies: account.cookie,
          srcFid,
          destFid
        }
      }
      
      const response = await $fetch<{ success: boolean; message?: string }>(apiPath, {
        method: 'POST',
        body
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
      
      if (account.driveCode === 'xunlei') {
        // 迅雷网盘暂不支持复制功能
        toast.add({
          severity: 'info',
          summary: t('info'),
          detail: '迅雷网盘暂不支持文件复制功能',
          life: 3000
        })
        return
      }
      
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
      
      let apiPath: string
      let body: any
      
      if (account.driveCode === 'xunlei') {
        apiPath = '/api/cloud-drive/thunder/create-share'
        body = {
          refreshToken: account.refreshToken,
          captchaUserId: account.captchaUserId,
          fileIds: [fid]
        }
      } else {
        apiPath = account.driveCode === 'uc'
          ? '/api/cloud-drive/uc/create-share'
          : '/api/cloud-drive/quark/create-share'
        body = {
          cookies: account.cookie,
          fidList: [fid],
          passcode,
          expiredType
        }
      }
      
      const response = await $fetch<{ success: boolean; data?: any; message?: string }>(apiPath, {
        method: 'POST',
        body
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
      
      let apiPath: string
      let body: any
      
      if (account.driveCode === 'xunlei') {
        apiPath = '/api/cloud-drive/thunder/user-info'
        body = {
          refreshToken: account.refreshToken,
          captchaUserId: account.captchaUserId
        }
      } else {
        apiPath = account.driveCode === 'uc'
          ? '/api/cloud-drive/uc/user-info'
          : '/api/cloud-drive/quark/user-info'
        body = {
          cookies: account.cookie
        }
      }
      
      const response = await $fetch<{ success: boolean; data?: any; message?: string }>(apiPath, {
        method: 'POST',
        body
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
      
      if (driveCode === 'thunder') {
        // 迅雷网盘暂不支持获取分享信息功能
        return {
          success: false,
          message: '迅雷网盘暂不支持获取分享信息功能'
        }
      }
      
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
      
      if (account.driveCode === 'xunlei') {
        // 迅雷网盘暂不支持获取分享stoken功能
        return {
          success: false,
          message: '迅雷网盘暂不支持获取分享stoken功能'
        }
      }
      
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
      
      if (account.driveCode === 'xunlei') {
        // 迅雷网盘暂不支持获取分享列表功能
        return {
          success: false,
          message: '迅雷网盘暂不支持获取分享列表功能'
        }
      }
      
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
      
      if (account.driveCode === 'xunlei') {
        // 迅雷网盘暂不支持保存分享文件功能
        toast.add({
          severity: 'info',
          summary: t('info'),
          detail: '迅雷网盘暂不支持保存分享文件功能',
          life: 3000
        })
        return {
          success: false,
          message: '迅雷网盘暂不支持保存分享文件功能'
        }
      }
      
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
