<template>
  <div class="h-full">
    <div v-if="loading" class="flex items-center justify-center h-full">
      <i class="pi pi-spin pi-spinner text-primary-500 text-2xl"></i>
    </div>
    <div v-else-if="error" class="flex items-center justify-center h-full text-red-500">
      {{ error }}
    </div>
    <Tree
      v-else
      :value="treeData"
      v-model:expandedKeys="expandedKeys"
      :selectionMode="'single'"
      v-model:selectionKeys="selectedKeys"
      @node-expand="handleNodeExpand"
      @node-select="handleNodeSelect"
      loadingMode="icon"
      class="h-full"
    >
      <template #default="{ node }">
        <div class="flex items-center gap-2">
          <i v-if="node.data?.dir" class="pi pi-folder text-yellow-500"></i>
          <i v-else class="pi pi-file text-blue-500"></i>
          <span>{{ node.label }}</span>
        </div>
      </template>
    </Tree>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { t } from '../composables/useI18n'
import Tree from '../volt/Tree.vue'
import type { CloudDriveAccount, CloudFile } from '../composables/useCloudFileManagement'
import { useCloudFileManagement } from '../composables/useCloudFileManagement'

interface Props {
  account: CloudDriveAccount
  currentFid: string
  excludeFid?: string // 要排除的目录ID（例如当前文件所在的目录）
}

interface Emits {
  (e: 'select', fid: string, name: string): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const { loadFiles, loading } = useCloudFileManagement()

const treeData = ref<any[]>([])
const expandedKeys = ref<Record<string, boolean>>({})
const selectedKeys = ref<Record<string, boolean>>({})
const error = ref('')
const nodeFolders = ref<Record<string, CloudFile[]>>({}) // 存储每个节点的文件夹数据

// 初始化根目录
onMounted(async () => {
  await loadRootFolder()
})

// 加载根目录
const loadRootFolder = async () => {
  try {
    error.value = ''
    const files = await loadFiles(props.account, '0')
    nodeFolders.value['0'] = files || []
    treeData.value = convertFilesToTreeData(files || [], '0')
  } catch (err) {
    error.value = t('load_files_failed')
    console.error('加载根目录失败:', err)
  }
}

// 处理节点展开
const handleNodeExpand = async (node: any) => {
  const fid = node.key
  
  // 如果节点没有children属性，说明还没有加载过
  if (node.children === undefined) {
    node.loading = true
    
    try {
      const files = await loadFiles(props.account, fid)
      nodeFolders.value[fid] = files || []
      
      // 更新节点的children
      node.children = convertFilesToTreeData(files || [], fid)
      node.loading = false
    } catch (err) {
      error.value = t('load_files_failed')
      console.error('加载子目录失败:', err)
      node.loading = false
    }
  }
}

// 处理节点选择
const handleNodeSelect = (node: any) => {
  // 只有目录可以被选择
  if (node.data?.dir) {
    selectedKeys.value = { [node.key]: true }
    emit('select', node.key, node.label)
  }
}

// 将文件列表转换为树数据格式
const convertFilesToTreeData = (files: CloudFile[], parentFid: string): any[] => {
  if (!files || !Array.isArray(files)) {
    return []
  }
  
  return files
    .filter(file => file && file.fid !== props.excludeFid)
    .map(file => ({
      key: file.fid,
      label: file.file_name,
      data: file,
      leaf: !file.dir, // 文件是叶子节点，目录不是
      children: file.dir ? undefined : undefined // 目录的children在展开时动态加载
    }))
}

// 监听当前目录变化
watch(() => props.currentFid, (newFid) => {
  // 如果当前目录变化，重置选择
  selectedKeys.value = {}
})
</script>

<style scoped>
/* 可以添加自定义样式 */
</style>