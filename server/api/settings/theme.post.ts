export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  
  return {
    success: true,
    data: {
      ...body,
      updatedAt: new Date().toISOString()
    },
    message: 'theme_settings_saved'
  }
})