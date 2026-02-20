import { configManager } from '../../utils/config-manager'

export default defineEventHandler(async (event) => {
  const themeMode = configManager.get('Settings', 'Theme\\Mode', 'system')
  const primary = configManager.get('Settings', 'Theme\\Primary', 'emerald')
  const surface = configManager.get('Settings', 'Theme\\Surface', 'zinc')
  const bodyFont = configManager.get('Settings', 'Theme\\BodyFont', 'system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "PingFang SC", "Noto Sans CJK SC", "Microsoft YaHei", sans-serif')
  const headingFont = configManager.get('Settings', 'Theme\\HeadingFont', 'system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "PingFang SC", "Noto Sans CJK SC", "Microsoft YaHei", sans-serif')
  
  return {
    success: true,
    data: {
      themeMode,
      primary,
      surface,
      bodyFont,
      headingFont
    },
    message: '获取主题设置成功'
  }
})
