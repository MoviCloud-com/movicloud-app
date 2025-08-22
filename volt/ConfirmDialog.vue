
<template>
    <Dialog
      v-model:visible="visible"
      :header="header"
      :modal="true"
      :closable="true"
      class="w-full max-w-md"
    >
      <div class="py-4">
        <p class="text-surface-700 dark:text-surface-300">{{ message }}</p>
      </div>
      
      <template #footer>
        <div class="flex justify-end gap-2">
          <Button
            :label="cancelLabel"
            variant="outline"
            @click="handleCancel"
          />
          <Button
            :label="confirmLabel"
            @click="handleConfirm"
          />
        </div>
      </template>
    </Dialog>
  </template>
  
  <script setup lang="ts">
  import { computed } from 'vue'
  import Dialog from 'primevue/dialog'
  import Button from './Button.vue'
  
  interface Props {
    visible?: boolean
    header?: string
    message?: string
    confirmLabel?: string
    cancelLabel?: string
  }
  
  const props = withDefaults(defineProps<Props>(), {
    visible: false,
    header: '确认',
    message: '确定要执行此操作吗？',
    confirmLabel: '确认',
    cancelLabel: '取消'
  })
  
  const emit = defineEmits<{
    'update:visible': [value: boolean]
    'confirm': []
    'cancel': []
  }>()
  
  const visible = computed({
    get: () => props.visible,
    set: (value) => emit('update:visible', value)
  })
  
  const handleConfirm = () => {
    emit('confirm')
    visible.value = false
  }
  
  const handleCancel = () => {
    emit('cancel')
    visible.value = false
  }
  </script>