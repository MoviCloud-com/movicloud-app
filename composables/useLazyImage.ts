import { ref, onMounted, onUnmounted } from 'vue'

export interface LazyImageOptions {
  root?: Element | null
  rootMargin?: string
  threshold?: number
  priority?: 'high' | 'normal' | 'low'
}

export const useLazyImage = (options: LazyImageOptions = {}) => {
  const {
    root = null,
    rootMargin = '50px',
    threshold = 0.1,
    priority = 'normal'
  } = options

  const imageRef = ref<HTMLElement | null>(null)
  const isInViewport = ref(false)
  const isLoaded = ref(false)
  const hasError = ref(false)
  const observer = ref<IntersectionObserver | null>(null)

  // 创建Intersection Observer
  const createObserver = () => {
    if (typeof IntersectionObserver === 'undefined') {
      // 降级处理：如果不支持Intersection Observer，直接加载
      isInViewport.value = true
      return
    }

    observer.value = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            isInViewport.value = true
            // 高优先级图片立即加载，低优先级延迟加载
            if (priority === 'high') {
              loadImage()
            } else if (priority === 'normal') {
              // 使用requestIdleCallback或setTimeout延迟加载
              if (typeof requestIdleCallback !== 'undefined') {
                requestIdleCallback(() => loadImage(), { timeout: 100 })
              } else {
                setTimeout(loadImage, 50)
              }
            } else {
              // 低优先级延迟更长时间
              setTimeout(loadImage, 200)
            }
            
            // 图片进入视口后开始加载，但不立即停止观察
            // 只有在图片加载完成或失败后才停止观察
          }
        })
      },
      {
        root,
        rootMargin,
        threshold
      }
    )
  }

  // 加载图片
  const loadImage = () => {
    if (!imageRef.value || isLoaded.value || hasError.value) return
    
    const img = imageRef.value.querySelector('img')
    if (!img) return

    // 如果图片已经有src，说明已经加载过了
    if (img.src && img.src !== '') return

    // 设置图片src开始加载
    const dataSrc = img.getAttribute('data-src')
    if (dataSrc) {
      img.src = dataSrc
      img.removeAttribute('data-src')
      
      // 监听图片加载完成和失败事件
      img.onload = () => {
        isLoaded.value = true
        // 图片加载完成后停止观察
        if (imageRef.value && observer.value) {
          observer.value.unobserve(imageRef.value)
        }
      }
      
      img.onerror = () => {
        hasError.value = true
        // 图片加载失败后停止观察
        if (imageRef.value && observer.value) {
          observer.value.unobserve(imageRef.value)
        }
      }
    }
  }

  // 开始观察
  const startObserving = () => {
    if (imageRef.value && observer.value) {
      observer.value.observe(imageRef.value)
    }
  }

  // 停止观察
  const stopObserving = () => {
    if (imageRef.value && observer.value) {
      observer.value.unobserve(imageRef.value)
    }
  }

  // 清理
  const cleanup = () => {
    if (observer.value) {
      observer.value.disconnect()
      observer.value = null
    }
  }

  // 手动触发加载（用于高优先级图片）
  const loadImmediately = () => {
    isInViewport.value = true
    loadImage()
  }

  // 重置状态
  const reset = () => {
    isInViewport.value = false
    isLoaded.value = false
    hasError.value = false
  }

  onMounted(() => {
    createObserver()
    startObserving()
  })

  onUnmounted(() => {
    cleanup()
  })

  return {
    imageRef,
    isInViewport,
    isLoaded,
    hasError,
    loadImage,
    loadImmediately,
    reset,
    startObserving,
    stopObserving
  }
} 