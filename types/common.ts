// 通用接口定义
export interface BaseEntity {
  id: number;
}

export interface BreadcrumbItem {
  label: string;
  route?: string;
  icon?: string;
}

export interface MenuItem {
  id: string;
  icon: string;
  label: string;
  route: string;
}

// 存储配置选项接口
export interface StorageOptions {
  key: string;
  defaultValue?: any;
  serializer?: {
    read: (value: string) => any;
    write: (value: any) => string;
  };
}