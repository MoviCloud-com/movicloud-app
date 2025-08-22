import type { BaseEntity } from './common';

export interface FileItem extends BaseEntity {
  name: string;
  type: 'folder' | 'video' | 'file';
  size: string;
  modified: string;
}