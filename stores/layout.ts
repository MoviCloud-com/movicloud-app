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
  initialized: boolean
}

export const useLayoutStore = defineStore('layout', {
  state: (): LayoutState => ({
    sidebarCollapsed: false,
    themeMode: 'system',
    primary: 'movicloud',
    surface: 'zinc',
    bodyFont: '"DingTalk-JinBuTi", system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "PingFang SC", "Noto Sans CJK SC", "Microsoft YaHei", sans-serif',
    headingFont: '"AlimamaShuHeiTi-Bold", system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "PingFang SC", "Noto Sans CJK SC", "Microsoft YaHei", sans-serif',
    initialized: false
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
    getSystemTheme(): 'light' | 'dark' {
      if (process.client && window.matchMedia) {
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
      }
      return 'light'
    },

    applyFonts() {
      if (!process.client) return
      const root = document.documentElement
      root.style.setProperty('--app-body-font', this.bodyFont)
      root.style.setProperty('--app-heading-font', this.headingFont)
    },

    async updateFonts({ bodyFont, headingFont }: { bodyFont?: string; headingFont?: string }) {
      if (typeof bodyFont === 'string' && bodyFont.length > 0) {
        this.bodyFont = bodyFont
      }
      if (typeof headingFont === 'string' && headingFont.length > 0) {
        this.headingFont = headingFont
      } 
      this.applyFonts()
      await this.saveToServer()
    },

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

    async setThemeMode(mode: ThemeMode) {
      this.themeMode = mode

      if (mode === 'system') {
        this.applyDarkMode(this.getSystemTheme() === 'dark')
      } else {
        this.applyDarkMode(mode === 'dark')
      }

      if (process.client && mode === 'system') {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
        const handleChange = () => this.applyDarkMode(mediaQuery.matches)
        mediaQuery.addEventListener('change', handleChange)
      }
      
      await this.saveToServer()
    },
    
    toggleDarkMode() {
      const newMode = this.isDarkMode ? 'light' : 'dark'
      this.setThemeMode(newMode)
    },

    setSidebarCollapsed(collapsed: boolean) {
      this.sidebarCollapsed = collapsed
    
      if (process.client) {
        window.dispatchEvent(new CustomEvent('sidebar-toggle', {
          detail: { collapsed }
        }))
      }
    },
    
    toggleSidebar() {
      this.setSidebarCollapsed(!this.sidebarCollapsed)
    },

    applyColorsOnly(primaryColor?: Color, surfaceColor?: Color) {
      if (!process.client) return
      
      const root = document.documentElement
      
      if (primaryColor) {
        this.primary = primaryColor.name
        Object.entries(primaryColor.palette).forEach(([key, value]) => {
          root.style.setProperty(`--p-primary-${key}`, value)
        })
      }
      
      if (surfaceColor) {
        this.surface = surfaceColor.name
        Object.entries(surfaceColor.palette).forEach(([key, value]) => {
          root.style.setProperty(`--p-surface-${key}`, value)
        })
      }
    },

    async updateColors(type: 'primary' | 'surface', color: Color) {
      if (type === 'primary') {
        this.primary = color.name
      } else {
        this.surface = color.name
      }
  
      if (process.client) {
        const root = document.documentElement
        Object.entries(color.palette).forEach(([key, value]) => {
          root.style.setProperty(`--p-${type}-${key}`, value)
        })
      }
      
      await this.saveToServer()
    },

    async loadFromServer() {
      if (!process.client) return
            try {
        const response = await $fetch<{
          success: boolean
          data: {
            themeMode?: string
            primary?: string
            surface?: string
            bodyFont?: string
            headingFont?: string
          }
        }>('/api/settings/theme')
        if (response.success && response.data) {
          this.themeMode = (response.data.themeMode as ThemeMode) || 'system'
          this.primary = response.data.primary || 'movicloud'
          this.surface = response.data.surface || 'zinc'
          this.bodyFont = response.data.bodyFont || this.bodyFont
          this.headingFont = response.data.headingFont || this.headingFont
        }
      } catch (error) {
        console.warn('Failed to load theme settings from server:', error)
      } 
    },

    async saveToServer() {
      if (!process.client) return
      
      try {
        await $fetch('/api/settings/theme', {
          method: 'POST',
          body: {
            themeMode: this.themeMode,
            primary: this.primary,
            surface: this.surface,
            bodyFont: this.bodyFont,
            headingFont: this.headingFont
          }
        })
      } catch (error) {
        console.warn('Failed to save theme settings to server:', error)
      }
    },

    async initializeFromStorage() {
      if (!process.client || this.initialized) return
      
      await this.loadFromServer()
      this.initializeTheme()
      this.applyFonts()
      this.initialized = true
    },

    initializeTheme() {
      if (process.client) { 
        if (this.themeMode === 'system') {
          this.applyDarkMode(this.getSystemTheme() === 'dark')
        } else {
          this.applyDarkMode(this.themeMode === 'dark')
        }

        if (this.themeMode === 'system') {
          const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
          const handleChange = () => this.applyDarkMode(mediaQuery.matches)
          mediaQuery.addEventListener('change', handleChange)
        }
      }
    }
  }
})
