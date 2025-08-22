<template>
  <Dialog 
    v-model:visible="visible" 
    :header="header" 
    :style="{ width: '450px' }" 
    :modal="true"
    :closable="false"
  >
    <div class="flex items-center justify-center mb-4">
      <i class="pi pi-exclamation-triangle text-6xl text-orange-500"></i>
    </div>
    <p class="text-center text-surface-600 dark:text-surface-400 mb-6">
      {{ message }}
    </p>
    <template #footer>
      <div class="flex justify-end gap-3">
        <Button 
          :label="cancelLabel" 
          @click="handleCancel" 
          class="p-button-text"
        />
        <Button 
          :label="confirmLabel" 
          @click="handleConfirm" 
          class="p-button-danger"
        />
      </div>
    </template>
  </Dialog>
</template>

<script setup lang="ts">
import Dialog from '../volt/Dialog.vue'
import Button from '../volt/Button.vue'

interface Props {
  visible: boolean
  header?: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
}

interface Emits {
  (e: 'confirm'): void
  (e: 'cancel'): void
  (e: 'update:visible', value: boolean): void
}

const props = withDefaults(defineProps<Props>(), {
  header: '确认操作',
  confirmLabel: '确认',
  cancelLabel: '取消'
})

const emit = defineEmits<Emits>()

const handleConfirm = () => {
  emit('confirm')
  emit('update:visible', false)
}

const handleCancel = () => {
  emit('cancel')
  emit('update:visible', false)
}
</script> 