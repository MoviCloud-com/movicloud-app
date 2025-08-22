export default defineEventHandler(async (event) => {
  // 模拟用户数据
  const users = [
    { id: 1, name: '张三', email: 'zhangsan@example.com', role: 'admin' },
    { id: 2, name: '李四', email: 'lisi@example.com', role: 'user' },
    { id: 3, name: '王五', email: 'wangwu@example.com', role: 'user' }
  ]
  
  return {
    success: true,
    data: users,
    message: 'get_users_success'
  }
})