import { ref, computed } from 'vue'
import { useMoviCloudAPI, type NetdiskProject, type ProjectDetails, type MemberApplication, type SubmitMemberApplicationRequest, type NetdiskSummary } from './useMoviCloudAPI'
import { useDev } from './useDev'

export const useNetdiskApplications = () => {
  const { 
    getNetdiskProjects, 
    getNetdiskProjectDetails, 
    submitMemberApplication, 
    getMyApplications,
    getNetdiskSummary
  } = useMoviCloudAPI()
  const { error: devError } = useDev()

  // 状态
  const projects = ref<NetdiskProject[]>([])
  const projectDetails = ref<ProjectDetails | null>(null)
  const myApplications = ref<MemberApplication[]>([])
  const summaryData = ref<NetdiskSummary | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  // 获取可申请项目列表
  const fetchProjects = async () => {
    loading.value = true
    error.value = null

    try {
      projects.value = await getNetdiskProjects()
    } catch (err: any) {
      error.value = err.message || '获取项目列表失败'
      devError('获取网盘项目列表失败:', err)
    } finally {
      loading.value = false
    }
  }

  // 获取项目详情
  const fetchProjectDetails = async (projectId: number) => {
    loading.value = true
    error.value = null

    try {
      projectDetails.value = await getNetdiskProjectDetails(projectId)
    } catch (err: any) {
      error.value = err.message || '获取项目详情失败'
      devError('获取项目详情失败:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // 提交会员申请
  const submitApplication = async (data: SubmitMemberApplicationRequest) => {
    loading.value = true
    error.value = null

    try {
      const application = await submitMemberApplication(data)
      // 提交成功后，刷新我的申请列表
      await fetchMyApplications()
      return application
    } catch (err: any) {
      error.value = err.message || '提交申请失败'
      devError('提交申请失败:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // 获取我的申请
  const fetchMyApplications = async () => {
    loading.value = true
    error.value = null

    try {
      myApplications.value = await getMyApplications()
    } catch (err: any) {
      error.value = err.message || '获取申请记录失败'
      devError('获取申请记录失败:', err)
    } finally {
      loading.value = false
    }
  }

  // 获取推广数据汇总
  const fetchSummary = async (applicationId: number) => {
    loading.value = true
    error.value = null
    summaryData.value = null // 清空旧数据

    try {
      summaryData.value = await getNetdiskSummary(applicationId)
    } catch (err: any) {
      error.value = err.message || '获取推广数据失败'
      devError('获取推广数据失败:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // 计算属性
  const activeProjects = computed(() => 
    projects.value.filter(p => p.is_active).sort((a, b) => a.sort_order - b.sort_order)
  )

  const pendingApplications = computed(() => 
    myApplications.value.filter(a => a.status === 'pending')
  )

  const submittedApplications = computed(() => 
    myApplications.value.filter(a => a.status === 'submitted')
  )

  const approvedApplications = computed(() => 
    myApplications.value.filter(a => a.status === 'approved')
  )

  const rejectedApplications = computed(() => 
    myApplications.value.filter(a => a.status === 'rejected')
  )

  return {
    // 状态
    projects,
    projectDetails,
    myApplications,
    summaryData,
    loading,
    error,
    
    // 计算属性
    activeProjects,
    pendingApplications,
    submittedApplications,
    approvedApplications,
    rejectedApplications,
    
    // 方法
    fetchProjects,
    fetchProjectDetails,
    submitApplication,
    fetchMyApplications,
    fetchSummary
  }
}

