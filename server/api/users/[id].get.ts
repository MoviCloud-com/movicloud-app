export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')
  
  const user = {
    id: parseInt(id as string),
    name: `用户${id}`,
    email: `user${id}@example.com`,
    role: 'user',
    createdAt: new Date().toISOString()
  }
  
  return {
    success: true,
    data: user,
    message: 'get_user_detail_success'
  }
})