import type { BreadcrumbItem } from './common';

// 确保 ThemeMode 类型定义正确
export type ThemeMode = 'light' | 'dark' | 'system';

export interface AppState {
  primary: string;
  surface: string | null;
  themeMode: ThemeMode; // 替换原来的 darkMode
  sidebarCollapsed: boolean;
}

export interface ColorPalette {
  [key: string]: string;
}

export interface LayoutProps {
  showBreadcrumb?: boolean;
  backgroundType?: 'transparent' | 'solid';
  showBorder?: boolean;
}

export interface TopbarProps {
  backgroundType?: 'transparent' | 'solid';
  showBorder?: boolean;
  showBreadcrumb?: boolean;
}

export interface BreadcrumbProps {
  items: BreadcrumbItem[];
  showHome?: boolean;
  homeRoute?: string;
  homeIcon?: string;
  homeLabel?: string;
  separatorIcon?: string;
}