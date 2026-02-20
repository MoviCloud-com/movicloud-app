import { computed } from 'vue'
import { useToast } from 'primevue/usetoast'
import { t } from './useI18n'

export function useDemoMode() {
  const config = useRuntimeConfig()
  const toast = useToast()
  
  const isDemoMode = computed(() => {
    return config.public.platform === 'Demo'
  })
  
  const checkDemoPermission = (action?: string): boolean => {
    if (isDemoMode.value) {
      toast.add({
        severity: 'warn',
        summary: t('demo_mode_restricted'),
        detail: t('demo_mode_no_permission'),
        life: 3000
      })
      return false
    }
    return true
  }
  
  return {
    isDemoMode,
    checkDemoPermission
  }
}
