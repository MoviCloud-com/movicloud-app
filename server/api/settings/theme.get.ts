export default defineEventHandler(async (event) => {
  return {
    success: true,
    data: {
      theme: 'dark',
      primaryColor: '#3B82F6',
      sidebarCollapsed: false,
      language: 'zh-CN'
    },
    message: '获取主题设置成功'
  }
})