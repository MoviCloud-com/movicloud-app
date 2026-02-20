import { ref, computed } from 'vue'

export interface CloudDriveAccountInfo {
  driveCode: string
  name: string
  logo: string
  cookie: string
  isValid: boolean
  nickname?: string
  avatar?: string
}

export const useCloudDriveAccounts = () => {
  const accounts = ref<CloudDriveAccountInfo[]>([])
  const loading = ref(false)
  const error = ref('')

  const quarkAccounts = computed(() => 
    accounts.value.filter(acc => acc.driveCode === 'quark')
  )

  const ucAccounts = computed(() => 
    accounts.value.filter(acc => acc.driveCode === 'uc')
  )

  const hasValidQuarkAccount = computed(() => 
    quarkAccounts.value.some(acc => acc.isValid)
  )

  const hasValidUCAccount = computed(() => 
    ucAccounts.value.some(acc => acc.isValid)
  )

  const hasValidAccount = computed(() => 
    hasValidQuarkAccount.value || hasValidUCAccount.value
  )

  const loadAccounts = async () => {
    try {
      loading.value = true
      error.value = ''

      const response = await $fetch<{ success: boolean; data?: any }>('/api/settings/cloud-drive')
      
      if (response.success && response.data) {
        const accountList: CloudDriveAccountInfo[] = []

        if (response.data.quark && Array.isArray(response.data.quark)) {
          for (const acc of response.data.quark) {
            accountList.push({
              driveCode: 'quark',
              name: '夸克网盘',
              logo: '/images/cloud-drives/quark.png',
              cookie: acc.cookie || '',
              isValid: false,
              nickname: acc.nickname,
              avatar: acc.avatar
            })
          }
        }

        if (response.data.uc && Array.isArray(response.data.uc)) {
          for (const acc of response.data.uc) {
            accountList.push({
              driveCode: 'uc',
              name: 'UC网盘',
              logo: '/images/cloud-drives/uc.png',
              cookie: acc.cookie || '',
              isValid: false,
              nickname: acc.nickname,
              avatar: acc.avatar
            })
          }
        }

        accounts.value = accountList

        await verifyAllAccounts()
      }
    } catch (err) {
      error.value = '加载网盘账号失败'
      console.error('加载网盘账号失败:', err)
    } finally {
      loading.value = false
    }
  }

  const verifyAllAccounts = async () => {
    const verifyPromises = accounts.value.map(async (account) => {
      try {
        const apiPath = account.driveCode === 'uc'
          ? '/api/cloud-drive/uc/verify-cookie'
          : '/api/cloud-drive/quark/verify-cookie'

        const response = await $fetch<{ success: boolean; valid?: boolean }>(apiPath, {
          method: 'POST',
          body: {
            cookies: account.cookie
          }
        })

        account.isValid = response.success === true
      } catch (err) {
        account.isValid = false
        console.error(`验证${account.name}账号失败:`, err)
      }
    })

    await Promise.all(verifyPromises)
  }

  const getValidAccountByDriveCode = (driveCode: string): CloudDriveAccountInfo | undefined => {
    return accounts.value.find(acc => acc.driveCode === driveCode && acc.isValid)
  }

  const getValidAccountsByDriveCode = (driveCode: string): CloudDriveAccountInfo[] => {
    return accounts.value.filter(acc => acc.driveCode === driveCode && acc.isValid)
  }

  return {
    accounts,
    quarkAccounts,
    ucAccounts,
    hasValidQuarkAccount,
    hasValidUCAccount,
    hasValidAccount,
    loading,
    error,
    loadAccounts,
    verifyAllAccounts,
    getValidAccountByDriveCode,
    getValidAccountsByDriveCode
  }
}
