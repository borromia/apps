export type MediaType = 'image' | 'video' | 'pdf' | 'other';

export interface MediaItem {
  name: string;
  path: string; // Directory path
  fullPath: string; // Full relative path e.g. "chapter1/001.jpg"
  size: number;
  lastModified?: number;
  type: MediaType;
  mimeType: string;
  width?: number;
  height?: number;
  handle?: FileSystemFileHandle;
}

export interface MediaBlobCache {
  blobUrl: string;
  revoke: () => void;
}

