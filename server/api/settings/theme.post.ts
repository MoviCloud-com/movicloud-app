import { configManager } from '../../utils/config-manager'

interface ThemeSettings {
  themeMode?: string
  primary?: string
  surface?: string
  bodyFont?: string
  headingFont?: string
}

export default defineEventHandler(async (event) => {
  const body = await readBody<ThemeSettings>(event)
  
  if (body.themeMode !== undefined) {
    configManager.set('Settings', 'Theme\\Mode', body.themeMode)
  }
  if (body.primary !== undefined) {
    configManager.set('Settings', 'Theme\\Primary', body.primary)
  }
  if (body.surface !== undefined) {
    configManager.set('Settings', 'Theme\\Surface', body.surface)
  }
  if (body.bodyFont !== undefined) {
    configManager.set('Settings', 'Theme\\BodyFont', body.bodyFont)
  }
  if (body.headingFont !== undefined) {
    configManager.set('Settings', 'Theme\\HeadingFont', body.headingFont)
  }
  
  return {
    success: true,
    data: {
      ...body,
      updatedAt: new Date().toISOString()
    },
    message: 'theme_settings_saved'
  }
})
