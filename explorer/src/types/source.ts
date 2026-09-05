export type SourceType = 'filesystem' | 's3' | 'custom';

export interface StorageNode {
  name: string;
  path: string; // Relative path from root, e.g. "manga/one-piece"
  isDirectory: boolean;
  size?: number;
  lastModified?: number;
  childCount?: number;
  handle?: FileSystemHandle; // For local FS
}

export interface DirectoryListing {
  path: string;
  name: string;
  parentPath: string | null;
  directories: StorageNode[];
  files: StorageNode[];
  totalSize: number;
}

export interface FolderSearchResult {
  name: string;
  path: string;
  parentPath: string;
}

export interface S3Credentials {
  endpoint: string;
  region: string;
  bucket: string;
  accessKeyId: string;
  secretAccessKey: string;
  prefix?: string;
}

export interface StorageSource {
  readonly id: string;
  readonly name: string;
  readonly type: SourceType;
  readonly isWritable: boolean;

  // Connection Lifecycle
  connect(forceNew?: boolean): Promise<boolean>;
  disconnect?(): Promise<void>;
  isConnected(): boolean;
  
  // Navigation & Tree Structure
  getRootName(): string;
  listDirectory(path: string): Promise<DirectoryListing>;
  searchDirectories(query: string): Promise<FolderSearchResult[]>;
  getSortedSiblings?(parentPath: string, sortByCount?: boolean): Promise<string[]>;

  // Data & Media Retrieval
  getFileBlob(path: string, fileName: string): Promise<Blob>;
  getFileUrl?(path: string, fileName: string): Promise<string>;

  // Optional File & Folder Mutation / Trash
  moveToTrash?(path: string, fileName?: string): Promise<boolean>;
  deleteItem?(path: string, fileName?: string): Promise<boolean>;
}

