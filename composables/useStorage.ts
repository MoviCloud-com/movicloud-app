// 移除未使用的导入

class StorageService {
    private storage: Storage | null;

    constructor(storage?: Storage) {
        // 检查是否在客户端环境
        if (typeof window !== 'undefined') {
            this.storage = storage || localStorage;
        } else {
            this.storage = null;
        }
    }

    /**
     * 获取存储的值
     */
    get<T>(key: string, defaultValue?: T): T | null {
        if (!this.storage) {
            return defaultValue ?? null;
        }
        
        try {
            const item = this.storage.getItem(key);
            if (item === null) {
                return defaultValue ?? null;
            }
            return JSON.parse(item);
        } catch (error) {
            console.warn(`Failed to get item from storage with key "${key}":`, error);
            return defaultValue ?? null;
        }
    }

    /**
     * 设置存储的值
     */
    set<T>(key: string, value: T): boolean {
        if (!this.storage) {
            return false;
        }
        
        try {
            this.storage.setItem(key, JSON.stringify(value));
            return true;
        } catch (error) {
            console.warn(`Failed to set item to storage with key "${key}":`, error);
            return false;
        }
    }

    /**
     * 删除存储的值
     */
    remove(key: string): boolean {
        if (!this.storage) {
            return false;
        }
        
        try {
            this.storage.removeItem(key);
            return true;
        } catch (error) {
            console.warn(`Failed to remove item from storage with key "${key}":`, error);
            return false;
        }
    }

    /**
     * 清空所有存储
     */
    clear(): boolean {
        if (!this.storage) {
            return false;
        }
        
        try {
            this.storage.clear();
            return true;
        } catch (error) {
            console.warn('Failed to clear storage:', error);
            return false;
        }
    }

    /**
     * 检查是否支持存储
     */
    isSupported(): boolean {
        if (!this.storage) {
            return false;
        }
        
        try {
            const testKey = '__storage_test__';
            this.storage.setItem(testKey, 'test');
            this.storage.removeItem(testKey);
            return true;
        } catch {
            return false;
        }
    }
}

// 创建默认的存储服务实例
export const storageService = new StorageService();

// 导出 StorageService 类供其他地方使用
export { StorageService };

// 布局设置相关的存储键
export const STORAGE_KEYS = {
    LAYOUT_SETTINGS: 'app-layout-settings',
    USER_PREFERENCES: 'app-user-preferences',
    THEME_SETTINGS: 'app-theme-settings',
} as const;

import type { ThemeMode } from '../types/layout';

// 布局设置的类型定义
export interface LayoutSettings {
    primary: string;
    surface: string | null;
    themeMode: ThemeMode; // 替换原来的 darkMode
    sidebarCollapsed: boolean;
}

// 布局设置专用的存储服务
// 修改 LayoutStorageService 类，添加更强的错误处理
export class LayoutStorageService {
    private storage: StorageService;
    private key: string;

    constructor(storage: StorageService = storageService, key: string = STORAGE_KEYS.LAYOUT_SETTINGS) {
        this.storage = storage;
        this.key = key;
    }

    /**
     * 获取布局设置
     */
    // 移除复杂的错误处理和验证逻辑
    // 恢复备份版本的简洁实现
    getLayoutSettings(): Partial<LayoutSettings> {
        return this.storage.get<Partial<LayoutSettings>>(this.key, {}) || {};
    }

    /**
     * 保存布局设置
     */
    saveLayoutSettings(settings: Partial<LayoutSettings>): boolean {
        try {
            const success = this.storage.set(this.key, settings);
            
            // 立即验证保存是否成功
            if (success) {
                const verified = this.storage.get(this.key);
                return JSON.stringify(verified) === JSON.stringify(settings);
            }
            return false;
        } catch (error) {
            console.error('Failed to save layout settings:', error);
            return false;
        }
    }

    /**
     * 更新部分布局设置
     */
    updateLayoutSettings(updates: Partial<LayoutSettings>): boolean {
        const current = this.getLayoutSettings();
        const merged = { ...current, ...updates };
        return this.saveLayoutSettings(merged);
    }

    /**
     * 清除布局设置
     */
    clearLayoutSettings(): boolean {
        return this.storage.remove(this.key);
    }
}

// 创建布局存储服务实例
export const layoutStorageService = new LayoutStorageService();