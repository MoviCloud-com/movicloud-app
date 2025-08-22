import { defineStore } from 'pinia'
import type { ThemeMode } from '../types/layout'

interface Color {
  name: string
  palette: Record<string, string>
}

interface LayoutState {
  sidebarCollapsed: boolean
  themeMode: ThemeMode
  primary: string
  surface: string
  bodyFont: string
  headingFont: string
}

export const useLayoutStore = defineStore('layout', {
  state: (): LayoutState => ({
    sidebarCollapsed: false,
    themeMode: 'system',
    primary: 'emerald',
    surface: 'zinc',
    bodyFont: 'system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, \"PingFang SC\", \"Noto Sans CJK SC\", \"Microsoft YaHei\", sans-serif',
    headingFont: 'system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, \"PingFang SC\", \"Noto Sans CJK SC\", \"Microsoft YaHei\", sans-serif'
  }),

  getters: {
    isDarkMode: (state): boolean => {
      if (state.themeMode === 'system') {
        if (process.client && typeof window !== 'undefined' && window.matchMedia) {
          return window.matchMedia('(prefers-color-scheme: dark)').matches
        }
        return false
      }
      return state.themeMode === 'dark'
    }
  },

  actions: {
    // 获取系统主题
    getSystemTheme(): 'light' | 'dark' {
      if (process.client && window.matchMedia) {
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
      }
      return 'light'
    },

    // 应用字体到 CSS 变量
    applyFonts() {
      if (!process.client) return
      const root = document.documentElement
      root.style.setProperty('--app-body-font', this.bodyFont)
      root.style.setProperty('--app-heading-font', this.headingFont)
    },

    // 更新字体设置
    updateFonts({ bodyFont, headingFont }: { bodyFont?: string; headingFont?: string }) {
      if (typeof bodyFont === 'string' && bodyFont.length > 0) {
        this.bodyFont = bodyFont
      }
      if (typeof headingFont === 'string' && headingFont.length > 0) {
        this.headingFont = headingFont
      }
      this.saveToStorage()
      this.applyFonts()
    },

    // 应用暗色模式
    applyDarkMode(dark: boolean) {
      if (process.client) {
        const root = document.documentElement
        if (dark) {
          root.classList.add('p-dark', 'dark')
        } else {
          root.classList.remove('p-dark', 'dark')
        }
      }
    },

    // 设置主题模式
    setThemeMode(mode: ThemeMode) {
      this.themeMode = mode
      this.saveToStorage()
      
      // 立即应用主题
      if (mode === 'system') {
        this.applyDarkMode(this.getSystemTheme() === 'dark')
      } else {
        this.applyDarkMode(mode === 'dark')
      }

      // 监听系统主题变化
      if (process.client && mode === 'system') {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
        const handleChange = () => this.applyDarkMode(mediaQuery.matches)
        mediaQuery.addEventListener('change', handleChange)
      }
    },

    // 切换暗色模式
    toggleDarkMode() {
      const newMode = this.isDarkMode ? 'light' : 'dark'
      this.setThemeMode(newMode)
    },

    // 设置侧边栏状态
    setSidebarCollapsed(collapsed: boolean) {
      this.sidebarCollapsed = collapsed
      this.saveToStorage()
      
      // 发送自定义事件通知其他组件
      if (process.client) {
        window.dispatchEvent(new CustomEvent('sidebar-toggle', {
          detail: { collapsed }
        }))
      }
    },

    // 切换侧边栏
    toggleSidebar() {
      this.setSidebarCollapsed(!this.sidebarCollapsed)
    },

    // 更新颜色设置
    updateColors(type: 'primary' | 'surface', color: Color) {
      if (type === 'primary') {
        this.primary = color.name
      } else {
        this.surface = color.name
      }
      
      this.saveToStorage()
      
      // 应用颜色到 CSS 变量
      if (process.client) {
        const root = document.documentElement
        Object.entries(color.palette).forEach(([key, value]) => {
          root.style.setProperty(`--p-${type}-${key}`, value)
        })
      }
    },

    // 从 localStorage 恢复状态
    async initializeFromStorage() {
      if (!process.client) return
      
      try {
        const saved = localStorage.getItem('layout-settings')
        if (saved) {
          const parsed = JSON.parse(saved)
          this.$patch(parsed)
        }
      } catch (error) {
        console.warn('Failed to restore layout settings:', error)
      }
      
      // 初始化主题
      this.initializeTheme()
      // 应用字体
      this.applyFonts()
    },
    
    // 保存到 localStorage
    saveToStorage() {
      if (!process.client) return
      
      try {
        localStorage.setItem('layout-settings', JSON.stringify(this.$state))
      } catch (error) {
        console.warn('Failed to save layout settings:', error)
      }
    },

    // 初始化主题
    initializeTheme() {
      if (process.client) {
        // 应用当前主题
        if (this.themeMode === 'system') {
          this.applyDarkMode(this.getSystemTheme() === 'dark')
        } else {
          this.applyDarkMode(this.themeMode === 'dark')
        }

        // 监听系统主题变化
        if (this.themeMode === 'system') {
          const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
          const handleChange = () => this.applyDarkMode(mediaQuery.matches)
          mediaQuery.addEventListener('change', handleChange)
        }
      }
    }
  }
})