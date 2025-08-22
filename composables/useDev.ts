/**
 * 开发模式工具函数
 * 只在开发环境下执行console语句
 */

export const useDev = () => {
  // 前端环境检测：结合 NODE_ENV 和 Nuxt 运行时环境
  const isDev = process.env.NODE_ENV === 'development' || 
                process.env.NODE_ENV === undefined || // 开发环境可能没有设置 NODE_ENV
                (typeof window !== 'undefined' && window.location?.hostname === 'localhost')
  
  const log = (...args: any[]): void => {
    if (isDev) {
      console.log(...args)
    }
  }
  
  const error = (...args: any[]): void => {
    if (isDev) {
      console.error(...args)
    }
  }
  
  const warn = (...args: any[]) => {
    if (isDev) {
      console.warn(...args)
    }
  }
  
  const info = (...args: any[]) => {
    if (isDev) {
      console.info(...args)
    }
  }
  
  const debug = (...args: any[]) => {
    if (isDev) {
      console.debug(...args)
    }
  }
  
  const group = (label: string) => {
    if (isDev) {
      console.group(label)
    }
  }
  
  const groupEnd = () => {
    if (isDev) {
      console.groupEnd()
    }
  }
  
  const table = (data: any) => {
    if (isDev) {
      console.table(data)
    }
  }
  
  const time = (label: string) => {
    if (isDev) {
      console.time(label)
    }
  }
  
  const timeEnd = (label: string) => {
    if (isDev) {
      console.timeEnd(label)
    }
  }
  
  return {
    isDev,
    log,
    error,
    warn,
    info,
    debug,
    group,
    groupEnd,
    table,
    time,
    timeEnd
  }
} 