<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { t } from '../composables/useI18n';
import { useToast } from 'primevue/usetoast';
import { useDev } from '../composables/useDev';
import { triggerUserEvent } from '../composables/useUserEvents';
import Dialog from '../volt/Dialog.vue';
import InputText from '../volt/InputText.vue';
import { useUserProfile } from '../composables/useUserProfile';

const toast = useToast();
const { log, error: devError } = useDev();
const { fetchProfile, uploadAvatar, deleteAvatar, putUsername, putNickname, putEmail, putPassword } = useUserProfile();

// 用户数据
const user = ref({
  id: '',
  username: '',
  nickname: '',
  avatar: '',
  email: ''
});

// 模态框状态
const showAvatarModal = ref(false);
const showPasswordModal = ref(false);

// 表单数据
const avatarForm = ref({
  avatar: null as File | null
});

const basicForm = ref({
  username: '',
  nickname: '',
  email: ''
});



const passwordForm = ref({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
});

// 加载状态
const loading = ref(false);
const saving = ref(false);

// 头像预览
const avatarPreview = ref<string>('');

// 获取用户信息
let fetchUserInfoInFlight: Promise<void> | null = null
let hasFetchedUserOnce = false
const fetchUserInfo = async () => {
  if (fetchUserInfoInFlight) return fetchUserInfoInFlight
  if (hasFetchedUserOnce) return
  fetchUserInfoInFlight = (async () => {
    loading.value = true;
    try {
      const data = await fetchProfile()
      user.value = data as any
      basicForm.value.username = data.username
      basicForm.value.nickname = data.nickname || data.username
      basicForm.value.email = data.email || ''
    } catch (error) {
      devError('get_user_profile_failed', error);
      toast.add({ severity: 'error', summary: t('error'), detail: t(error instanceof Error ? error.message : 'request_failed'), life: 3000 });
    } finally {
      loading.value = false;
      hasFetchedUserOnce = true
      fetchUserInfoInFlight = null
    }
  })()
  return fetchUserInfoInFlight
};

// 处理头像文件选择
const handleAvatarSelect = (event: Event) => {
  const target = event.target as HTMLInputElement;
  if (target.files && target.files[0]) {
    const file = target.files[0];
    avatarForm.value.avatar = file;
    
    // 创建预览
    const reader = new FileReader();
    reader.onload = (e) => {
      avatarPreview.value = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  }
};

// 更新头像
const updateAvatar = async () => {
  if (!avatarForm.value.avatar) {
    toast.add({ severity: 'error', summary: t('error'), detail: t('please_select_avatar'), life: 3000 });
    return;
  }
  saving.value = true;
  try {
    const data = await uploadAvatar(avatarForm.value.avatar)
    user.value.avatar = data.avatar
    if (process.client) {
      const userStr = localStorage.getItem('user');
      if (userStr) { try { const storedUser = JSON.parse(userStr); storedUser.avatar = data.avatar; localStorage.setItem('user', JSON.stringify(storedUser)); } catch {} }
    }
    toast.add({ severity: 'success', summary: t('success'), detail: t('avatar_updated'), life: 3000 });
    triggerUserEvent('avatar_updated', { avatar: data.avatar });
    closeAvatarModal();
    avatarForm.value.avatar = null; avatarPreview.value = '';
  } catch (error) {
    devError('failed_to_update_avatar', error);
    toast.add({ severity: 'error', summary: t('error'), detail: t(error instanceof Error ? error.message : 'failed_to_update_avatar'), life: 3000 });
  } finally {
    saving.value = false;
  }
};

// 清除头像
const clearAvatar = async () => {
  if (saving.value) return;
  saving.value = true;
  try {
    await deleteAvatar()
    user.value.avatar = ''
    avatarPreview.value = ''
    if (process.client) {
      const userStr = localStorage.getItem('user');
      if (userStr) { try { const storedUser = JSON.parse(userStr); storedUser.avatar = ''; localStorage.setItem('user', JSON.stringify(storedUser)); } catch {} }
    }
    toast.add({ severity: 'success', summary: t('success'), detail: t('avatar_cleared'), life: 3000 });
    triggerUserEvent('avatar_updated', { avatar: '' });
    closeAvatarModal();
  } catch (e) {
    toast.add({ severity: 'error', summary: t('error'), detail: t(e instanceof Error ? e.message : 'clear_avatar_failed'), life: 3000 });
  } finally {
    saving.value = false;
  }
};

// 更新基本信息
const updateBasicInfo = async () => {
  if (!basicForm.value.username.trim()) {
    toast.add({ severity: 'error', summary: t('error'), detail: t('username_required'), life: 3000 });
    return;
  }
  saving.value = true;
  try {
    const tasks: Promise<void>[] = []
    if (basicForm.value.username !== user.value.username) tasks.push(putUsername(basicForm.value.username))
    if (basicForm.value.nickname !== user.value.nickname) tasks.push(putNickname(basicForm.value.nickname))
    if (basicForm.value.email !== user.value.email) tasks.push(putEmail(basicForm.value.email))

    if (tasks.length > 0) {
      await Promise.all(tasks)
      user.value.username = basicForm.value.username
      user.value.nickname = basicForm.value.nickname
      user.value.email = basicForm.value.email
      if (process.client) {
        const userStr = localStorage.getItem('user');
        if (userStr) {
          try {
            const storedUser = JSON.parse(userStr);
            storedUser.username = basicForm.value.username;
            storedUser.nickname = basicForm.value.nickname;
            storedUser.email = basicForm.value.email;
            localStorage.setItem('user', JSON.stringify(storedUser));
          } catch (error) {
            devError('update_local_user_failed', error);
          }
        }
      }
      toast.add({ severity: 'success', summary: t('success'), detail: t('save_changes'), life: 3000 });
      triggerUserEvent('profile_updated', { username: basicForm.value.username, nickname: basicForm.value.nickname, email: basicForm.value.email })
    } else {
      toast.add({ severity: 'success', summary: t('success'), detail: t('save_changes'), life: 3000 });
      triggerUserEvent('profile_updated', { username: basicForm.value.username, nickname: basicForm.value.nickname, email: basicForm.value.email })
    }
  } catch (error) {
    devError('update_basic_info_failed', error);
    toast.add({ severity: 'error', summary: t('error'), detail: t(error instanceof Error ? error.message : 'request_failed'), life: 3000 });
  } finally {
    saving.value = false;
  }
};

// 更新密码
const updatePassword = async () => {
  if (!passwordForm.value.currentPassword || !passwordForm.value.newPassword || !passwordForm.value.confirmPassword) {
    toast.add({ severity: 'error', summary: t('error'), detail: t('all_fields_required'), life: 3000 });
    return;
  }
  if (passwordForm.value.newPassword !== passwordForm.value.confirmPassword) {
    toast.add({ severity: 'error', summary: t('error'), detail: t('password_mismatch'), life: 3000 });
    return;
  }
  saving.value = true;
  try {
    await putPassword(passwordForm.value.currentPassword, passwordForm.value.newPassword)
    toast.add({ severity: 'success', summary: t('success'), detail: t('password_updated'), life: 3000 });
    showPasswordModal.value = false;
    passwordForm.value = { currentPassword: '', newPassword: '', confirmPassword: '' };
  } catch (error) {
    devError('password_update_failed', error);
    toast.add({ severity: 'error', summary: t('error'), detail: t(error instanceof Error ? error.message : 'password_update_failed'), life: 3000 });
  } finally {
    saving.value = false;
  }
};

// 关闭模态框
const closeAvatarModal = () => {
  showAvatarModal.value = false;
  avatarForm.value.avatar = null;
  avatarPreview.value = '';
};



const closePasswordModal = () => {
  showPasswordModal.value = false;
  passwordForm.value = {
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  };
};



// 页面加载时获取用户信息
onMounted(() => {
  fetchUserInfo();
});

// 设置页面标题
useHead({
  title: t('profile') + ' - MoviCloud',
  meta: [
    { name: 'description', content: t('profile_description') }
  ]
});
</script>

<template>
  <div class="bg-surface-50 dark:bg-surface-950 min-h-screen">
    <!-- 背景头部 -->
    <div class="relative h-48 bg-gradient-to-b from-primary-500 to-transparent">
      <!-- 背景装饰 -->
      <div class="absolute inset-0"></div>
      
      <!-- 内容 -->
      <div class="relative h-full flex items-center justify-center">
        <div class="text-center text-white">
          <h1 class="text-5xl font-bold mb-4">{{ t('profile') }}</h1>
          <p class="text-xl opacity-90">{{ t('profile_subtitle') }}</p>
        </div>
      </div>
      
      <!-- 底部渐变 -->
      <div class="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-b from-transparent to-surface-50 dark:to-surface-950"></div>
    </div>
    
    <div class="p-6">
      <div class="max-w-2xl mx-auto">
        <!-- 加载状态 -->
        <div v-if="loading" class="text-sm text-blue-500 mb-4">
          {{ t('loading_user_info') }}
        </div>

        <!-- 头像设置 -->
        <div class="bg-white dark:bg-surface-800 rounded-lg shadow-sm p-6 mb-6">
          <h3 class="text-lg font-semibold text-surface-900 dark:text-surface-0 mb-4">{{ t('avatar') }}</h3>
          <div class="flex items-center space-x-4">
            <div class="relative">
              <div class="w-20 h-20 bg-primary-500 rounded-full flex items-center justify-center text-white text-2xl font-bold overflow-hidden">
                <img 
                  v-if="user.avatar" 
                  :src="user.avatar" 
                  :alt="user.nickname || user.username"
                  class="w-full h-full object-cover"
                />
                <span v-else>{{ (user.nickname || user.username || '').charAt(0) }}</span>
              </div>
            </div>
            <div class="flex-1">
              <p class="text-sm text-surface-600 dark:text-surface-400 mb-2">{{ t('avatar_upload_tip') }}</p>
              <button 
                @click="() => { showAvatarModal = true; if (!avatarPreview && user.avatar) { avatarPreview = user.avatar as unknown as string } }"
                class="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
              >
                {{ t('change_avatar') }}
              </button>
            </div>
          </div>
        </div>

        <!-- 基本信息 -->
        <div class="bg-white dark:bg-surface-800 rounded-lg shadow-sm p-6 mb-6">
          <h3 class="text-lg font-semibold text-surface-900 dark:text-surface-0 mb-4">{{ t('basic_info') }}</h3>
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">{{ t('username_label') }}</label>
              <InputText
                v-model="basicForm.username"
                :placeholder="t('username_placeholder')"
                class="w-full"
              />
            </div>
            
            <div>
              <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">{{ t('nickname') }}</label>
              <InputText
                v-model="basicForm.nickname"
                :placeholder="t('enter_nickname')"
                class="w-full"
              />
            </div>
            
            <div>
              <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">{{ t('email') }}</label>
              <InputText
                v-model="basicForm.email"
                :placeholder="t('email_placeholder')"
                class="w-full"
              />
          </div>

            <div class="pt-4">
              <button 
                @click="updateBasicInfo"
                :disabled="saving"
                class="w-full px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <i v-if="saving" class="pi pi-spin pi-spinner mr-2"></i>
                {{ saving ? t('saving') : t('save_changes') }}
              </button>
          </div>
          </div>
        </div>

        <!-- 安全设置 -->
        <div class="bg-white dark:bg-surface-800 rounded-lg shadow-sm p-6">
          <h3 class="text-lg font-semibold text-surface-900 dark:text-surface-0 mb-4">{{ t('security_settings') }}</h3>
          <div class="space-y-4">
            <div class="flex items-center justify-between p-4 bg-surface-100 dark:bg-surface-700 rounded-lg">
              <div>
                <h4 class="font-medium text-surface-900 dark:text-surface-0">{{ t('login_password') }}</h4>
                <p class="text-sm text-surface-600 dark:text-surface-400">{{ t('password_security_tip') }}</p>
              </div>
              <button 
                @click="showPasswordModal = true"
                class="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
              >
                {{ t('change_password') }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  
    <!-- 头像修改模态框 -->
    <Dialog 
      v-model:visible="showAvatarModal" 
      :header="t('change_avatar')"
      :style="{ width: '400px' }"
      :modal="true"
      :closable="true"
      @hide="closeAvatarModal"
    >
      <div class="space-y-4">
        <div class="text-center">
          <div class="w-32 h-32 bg-primary-500 rounded-full flex items-center justify-center text-white text-4xl font-bold mx-auto mb-4 overflow-hidden">
            <img 
              v-if="avatarPreview || user.avatar" 
              :src="avatarPreview || user.avatar" 
              class="w-full h-full object-cover"
            />
            <span v-else>{{ (user.nickname || user.username || '').charAt(0) }}</span>
          </div>
          <input
            type="file"
            accept="image/*"
            @change="handleAvatarSelect"
            class="hidden"
            id="avatar-input"
          />
          <label 
            for="avatar-input"
            class="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors cursor-pointer"
          >
            {{ t('select_file') }}
          </label>
        </div>
      </div>
      
      <template #footer>
        <div class="flex justify-between gap-2">
          <button 
            @click="clearAvatar"
            class="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
          >
            {{ t('clear_avatar') }}
          </button>
          <div class="flex gap-2">
            <button 
              @click="closeAvatarModal"
              class="px-4 py-2 bg-surface-100 dark:bg-surface-700 text-surface-700 dark:text-surface-300 rounded-lg hover:bg-surface-200 dark:hover:bg-surface-600 transition-colors"
            >
              {{ t('cancel') }}
            </button>
            <button 
              @click="updateAvatar"
              :disabled="!avatarForm.avatar || saving"
              class="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <i v-if="saving" class="pi pi-spin pi-spinner mr-2"></i>
              {{ saving ? t('saving') : t('save') }}
            </button>
          </div>
        </div>
      </template>
    </Dialog>

    <!-- 密码修改模态框 -->
    <Dialog 
      v-model:visible="showPasswordModal" 
      :header="t('change_password')"
      :style="{ width: '400px' }"
      :modal="true"
      :closable="true"
      @hide="closePasswordModal"
    >
      <div class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">{{ t('current_password') }}</label>
          <InputText
            v-model="passwordForm.currentPassword"
            type="password"
            :placeholder="t('enter_current_password')"
            class="w-full"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">{{ t('new_password') }}</label>
          <InputText
            v-model="passwordForm.newPassword"
            type="password"
            :placeholder="t('enter_new_password')"
            class="w-full"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-2">{{ t('confirm_password') }}</label>
          <InputText
            v-model="passwordForm.confirmPassword"
            type="password"
            :placeholder="t('enter_confirm_password')"
            class="w-full"
          />
        </div>
      </div>
      
      <template #footer>
        <div class="flex justify-end gap-2">
          <button 
            @click="closePasswordModal"
            class="px-4 py-2 bg-surface-100 dark:bg-surface-700 text-surface-700 dark:text-surface-300 rounded-lg hover:bg-surface-200 dark:hover:bg-surface-600 transition-colors"
          >
            {{ t('cancel') }}
          </button>
          <button 
            @click="updatePassword"
            :disabled="!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword || saving"
            class="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <i v-if="saving" class="pi pi-spin pi-spinner mr-2"></i>
            {{ saving ? t('saving') : t('save') }}
          </button>
        </div>
      </template>
    </Dialog>
  </div>
</template>