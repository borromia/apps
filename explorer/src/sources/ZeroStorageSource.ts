import {
  StorageSource,
  DirectoryListing,
  StorageNode,
  FolderSearchResult,
  SourceType,
  ZeroStorageCredentials
} from '../types/source';
import { isMediaFile } from '../services/mediaDetector';
import { saveZeroStorageConfig, getSavedZeroStorageConfig, clearSavedZeroStorageConfig } from '../services/storageDb';

interface ZeroStorageRawFolder {
  id: string;
  name: string;
  description?: string;
  parent_id?: string | null;
  parentId?: string | null;
  created_at?: string;
}

interface ZeroStorageRawFile {
  id: string;
  name?: string;
  filename?: string;
  size?: number;
  file_size?: number;
  folder_id?: string | null;
  folderId?: string | null;
  url?: string;
  created_at?: string;
}

class RateLimiter {
  private queue: Array<() => void> = [];
  private timestamps: number[] = [];
  private maxRequests: number;
  private timeWindowMs: number;
  private timer: ReturnType<typeof setTimeout> | null = null;

  constructor(maxRequests = 15, timeWindowMs = 1000) {
    this.maxRequests = maxRequests;
    this.timeWindowMs = timeWindowMs;
  }

  async schedule<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const result = await fn();
          resolve(result);
        } catch (err) {
          reject(err);
        }
      });
      this.processQueue();
    });
  }

  private processQueue() {
    if (this.queue.length === 0) return;

    const now = Date.now();
    this.timestamps = this.timestamps.filter((t) => now - t < this.timeWindowMs);

    if (this.timestamps.length < this.maxRequests) {
      const task = this.queue.shift();
      if (task) {
        this.timestamps.push(Date.now());
        task();
      }
      if (this.queue.length > 0) {
        this.processQueue();
      }
    } else {
      if (!this.timer) {
        const oldest = this.timestamps[0] || now;
        const waitMs = Math.max(oldest + this.timeWindowMs - now + 15, 25);
        this.timer = setTimeout(() => {
          this.timer = null;
          this.processQueue();
        }, waitMs);
      }
    }
  }
}

// Global request cache across component remounts, navigations, and instances (excluding binary downloads)
const globalZeroStorageApiCache = new Map<string, any>();
const globalZeroStorageInFlight = new Map<string, Promise<any>>();

if (typeof window !== 'undefined') {
  (window as any).__ZEROSTORAGE_API_CACHE__ = globalZeroStorageApiCache;
}

export function clearZeroStorageApiCache(): void {
  globalZeroStorageApiCache.clear();
  globalZeroStorageInFlight.clear();
}

export class ZeroStorageSource implements StorageSource {
  readonly id = 'zerostorage';
  readonly name = 'ZeroStorage Cloud';
  readonly type: SourceType = 'zerostorage';
  readonly isWritable = true;

  private config: ZeroStorageCredentials | null = null;
  private apiBaseUrl = 'https://zerostorage.net/api';
  private rateLimiter = new RateLimiter(15, 1000); // 15 requests per second max

  // Dynamic caches
  private foldersById = new Map<string, ZeroStorageRawFolder>();
  private folderIdByPath = new Map<string, string>(); // 'photos/vacation' -> 'folder-123'
  private pathByFolderId = new Map<string, string>(); // 'folder-123' -> 'photos/vacation'
  private childFoldersByParentId = new Map<string, ZeroStorageRawFolder[]>(); // parentId ('' for root) -> children
  private filesByFolderId = new Map<string, StorageNode[]>(); // folderId ('' for root) -> files
  private fileIdMap = new Map<string, string>(); // 'path/filename' -> fileId
  private downloadUrlCache = new Map<string, { url: string; timestamp: number }>();

  constructor(config?: ZeroStorageCredentials) {
    if (config) {
      this.config = config;
      if (config.apiBaseUrl) {
        this.apiBaseUrl = config.apiBaseUrl.replace(/\/+$/, '');
      }
    }
  }

  async setCredentials(config: ZeroStorageCredentials): Promise<void> {
    this.config = config;
    if (config.apiBaseUrl) {
      this.apiBaseUrl = config.apiBaseUrl.replace(/\/+$/, '');
    }
    await saveZeroStorageConfig(config);
    this.invalidateCache();
  }

  async connect(forceNew = false): Promise<boolean> {
    if (!this.config || forceNew) {
      const saved = await getSavedZeroStorageConfig();
      if (saved && !forceNew) {
        this.config = saved;
        if (saved.apiBaseUrl) {
          this.apiBaseUrl = saved.apiBaseUrl.replace(/\/+$/, '');
        }
      } else {
        return false;
      }
    }

    try {
      // Test credentials with a quick check
      await this.request<{ folders: any[] }>('/folders?page=1&limit=1');
      return true;
    } catch (err) {
      console.error('ZeroStorage connection failed:', err);
      return false;
    }
  }

  async disconnect(): Promise<void> {
    this.config = null;
    this.invalidateCache();
    await clearSavedZeroStorageConfig();
  }

  isConnected(): boolean {
    return Boolean(this.config?.apiKey);
  }

  getRootName(): string {
    return 'ZeroStorage Cloud';
  }

  private invalidateCache() {
    this.foldersById.clear();
    this.folderIdByPath.clear();
    this.pathByFolderId.clear();
    this.childFoldersByParentId.clear();
    this.filesByFolderId.clear();
    this.fileIdMap.clear();
    this.downloadUrlCache.clear();
    clearZeroStorageApiCache();
  }

  /**
   * Rate-limited fetch with automatic 429 exponential backoff retry.
   */
  private async fetchWithRateLimit(url: string, options: RequestInit = {}, maxRetries = 3): Promise<Response> {
    return this.rateLimiter.schedule(async () => {
      let attempt = 0;
      while (attempt <= maxRetries) {
        try {
          const res = await fetch(url, options);
          if (res.status === 429 && attempt < maxRetries) {
            const retryAfterHeader = res.headers.get('Retry-After');
            const retryAfterMs = retryAfterHeader
              ? parseInt(retryAfterHeader, 10) * 1000
              : 1000 * Math.pow(2, attempt);
            console.warn(
              `ZeroStorage rate limit (429) hit. Backing off for ${retryAfterMs}ms (attempt ${attempt + 1}/${maxRetries})...`
            );
            await new Promise((resolve) => setTimeout(resolve, retryAfterMs));
            attempt++;
            continue;
          }
          return res;
        } catch (err) {
          if (attempt < maxRetries) {
            await new Promise((resolve) => setTimeout(resolve, 500 * Math.pow(2, attempt)));
            attempt++;
            continue;
          }
          throw err;
        }
      }
      throw new Error('Max retries reached for ZeroStorage request');
    });
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    if (!this.config?.apiKey) {
      throw new Error('ZeroStorage API key is missing.');
    }

    const method = (options.method || 'GET').toUpperCase();
    const isGet = method === 'GET';
    const cacheKey = `${this.config.apiKey}:${endpoint}`;

    if (isGet) {
      if (globalZeroStorageApiCache.has(cacheKey)) {
        return globalZeroStorageApiCache.get(cacheKey) as T;
      }
      if (globalZeroStorageInFlight.has(cacheKey)) {
        return globalZeroStorageInFlight.get(cacheKey) as Promise<T>;
      }
    }

    const url = `${this.apiBaseUrl}${endpoint}`;
    const headers: HeadersInit = {
      'x-api-key': this.config.apiKey,
      ...options.headers,
    };

    const fetchPromise = (async () => {
      try {
        const response = await this.fetchWithRateLimit(url, {
          ...options,
          headers,
        });

        if (!response.ok) {
          const errText = await response.text().catch(() => response.statusText);
          throw new Error(`ZeroStorage API error (${response.status}): ${errText}`);
        }

        const data = (await response.json()) as T;
        if (isGet) {
          globalZeroStorageApiCache.set(cacheKey, data);
        } else {
          clearZeroStorageApiCache();
        }
        return data;
      } finally {
        if (isGet) {
          globalZeroStorageInFlight.delete(cacheKey);
        }
      }
    })();

    if (isGet) {
      globalZeroStorageInFlight.set(cacheKey, fetchPromise);
    }

    return fetchPromise;
  }

  /**
   * Fetch child folders for a given parent folder ID (or '' for root).
   */
  private async fetchChildFolders(parentId: string): Promise<ZeroStorageRawFolder[]> {
    const allFolders: ZeroStorageRawFolder[] = [];
    let page = 1;
    let hasMore = true;

    while (hasMore) {
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', '100');
      if (parentId) {
        params.append('parentId', parentId);
      }

      const res = await this.request<{ folders: ZeroStorageRawFolder[] }>(
        `/folders?${params.toString()}`
      );

      if (!res.folders || res.folders.length === 0) {
        hasMore = false;
      } else {
        const folders = res.folders.map((f) => ({
          ...f,
          parent_id: f.parent_id || f.parentId || (parentId || null),
          parentId: f.parentId || f.parent_id || (parentId || null),
        }));
        allFolders.push(...folders);
        if (res.folders.length < 100) {
          hasMore = false;
        } else {
          page++;
        }
      }
    }

    // Update caches
    this.childFoldersByParentId.set(parentId, allFolders);
    for (const folder of allFolders) {
      this.foldersById.set(folder.id, folder);
    }

    return allFolders;
  }

  /**
   * Resolve a relative virtual path ('', 'folder', 'folder/subfolder') to a ZeroStorage folder ID.
   */
  private async resolveFolderId(path: string): Promise<string> {
    const normalizedPath = path.replace(/^\/+|\/+$/g, '');
    if (!normalizedPath) return '';

    if (this.folderIdByPath.has(normalizedPath)) {
      return this.folderIdByPath.get(normalizedPath)!;
    }

    const segments = normalizedPath.split('/').filter(Boolean);
    let currentParentId = '';
    let currentPath = '';

    for (const segment of segments) {
      currentPath = currentPath ? `${currentPath}/${segment}` : segment;

      if (this.folderIdByPath.has(currentPath)) {
        currentParentId = this.folderIdByPath.get(currentPath)!;
        continue;
      }

      let children = this.childFoldersByParentId.get(currentParentId);
      if (!children) {
        children = await this.fetchChildFolders(currentParentId);
      }

      let match = children.find((f) => f.name === segment);
      if (!match) {
        // Refresh children in case of stale cache
        children = await this.fetchChildFolders(currentParentId);
        match = children.find((f) => f.name === segment);
        if (!match) {
          throw new Error(`Directory not found in ZeroStorage: "${currentPath}"`);
        }
      }

      currentParentId = match.id;
      this.folderIdByPath.set(currentPath, match.id);
      this.pathByFolderId.set(match.id, currentPath);
    }

    return currentParentId;
  }

  /**
   * Fetch all files belonging to a specific folder ID (or '' for root).
   */
  private async fetchFilesForFolder(folderId: string, folderPath: string): Promise<StorageNode[]> {
    const nodes: StorageNode[] = [];
    let page = 1;
    let hasMore = true;

    while (hasMore) {
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', '100');
      params.append('sort', 'newest');
      if (folderId) {
        params.append('folderId', folderId);
        params.append('folder_id', folderId);
      }

      const res = await this.request<{ files: ZeroStorageRawFile[]; pagination?: any }>(
        `/files/list?${params.toString()}`
      );

      if (!res.files || res.files.length === 0) {
        hasMore = false;
      } else {
        for (const file of res.files) {
          const fileFolderId = file.folder_id || file.folderId || '';
          // Ensure file matches requested folder if API returns all files
          if (folderId && fileFolderId && fileFolderId !== folderId) {
            continue;
          }
          if (!folderId && fileFolderId) {
            continue;
          }

          const fileName = file.filename || file.name || 'Untitled';
          if (!isMediaFile(fileName)) continue;

          const fullPath = folderPath ? `${folderPath}/${fileName}` : fileName;
          const size = file.file_size || file.size || 0;
          const lastModified = file.created_at ? new Date(file.created_at).getTime() : undefined;

          nodes.push({
            name: fileName,
            path: fullPath,
            isDirectory: false,
            size,
            lastModified,
          });

          this.fileIdMap.set(fullPath, file.id);
          this.fileIdMap.set(file.id, file.id);
        }

        if (res.files.length < 100) {
          hasMore = false;
        } else {
          page++;
        }
      }
    }

    this.filesByFolderId.set(folderId, nodes);
    return nodes;
  }

  async listDirectory(path: string): Promise<DirectoryListing> {
    const normalizedPath = path.replace(/^\/+|\/+$/g, '');
    const currentFolderId = await this.resolveFolderId(normalizedPath);

    const parentPath = normalizedPath.includes('/')
      ? normalizedPath.substring(0, normalizedPath.lastIndexOf('/'))
      : normalizedPath ? '' : null;

    const folderName = normalizedPath
      ? normalizedPath.split('/').pop() || normalizedPath
      : this.getRootName();

    // Fetch subdirectories on-demand for this folder
    const subRawFolders = await this.fetchChildFolders(currentFolderId);
    const directories: StorageNode[] = subRawFolders.map((f) => {
      const subPath = normalizedPath ? `${normalizedPath}/${f.name}` : f.name;
      this.folderIdByPath.set(subPath, f.id);
      this.pathByFolderId.set(f.id, subPath);
      return {
        name: f.name,
        path: subPath,
        isDirectory: true,
        childCount: 0,
      };
    });

    // Fetch files in this folder
    const files = await this.fetchFilesForFolder(currentFolderId, normalizedPath);
    const totalSize = files.reduce((acc, f) => acc + (f.size || 0), 0);

    directories.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }));
    files.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }));

    return {
      path: normalizedPath,
      name: folderName,
      parentPath,
      directories,
      files,
      totalSize,
    };
  }

  /**
   * Discover all folders recursively across the account for global search.
   */
  private async discoverAllFolders(): Promise<void> {
    const queue: string[] = [''];
    const visited = new Set<string>();

    while (queue.length > 0) {
      const parentId = queue.shift()!;
      if (visited.has(parentId)) continue;
      visited.add(parentId);

      let children = this.childFoldersByParentId.get(parentId);
      if (!children) {
        children = await this.fetchChildFolders(parentId);
      }

      for (const child of children) {
        const parentPath = parentId ? this.pathByFolderId.get(parentId) || '' : '';
        const childPath = parentPath ? `${parentPath}/${child.name}` : child.name;
        this.folderIdByPath.set(childPath, child.id);
        this.pathByFolderId.set(child.id, childPath);
        queue.push(child.id);
      }
    }
  }

  async searchDirectories(query: string): Promise<FolderSearchResult[]> {
    await this.discoverAllFolders();

    const results: FolderSearchResult[] = [];
    const q = query.toLowerCase().trim();

    for (const [virtualPath, folderId] of this.folderIdByPath.entries()) {
      const folder = this.foldersById.get(folderId);
      if (!folder) continue;

      if (!q || folder.name.toLowerCase().includes(q) || virtualPath.toLowerCase().includes(q)) {
        const parentPath = virtualPath.includes('/')
          ? virtualPath.substring(0, virtualPath.lastIndexOf('/'))
          : this.getRootName();

        results.push({
          name: folder.name,
          path: virtualPath,
          parentPath,
        });
      }
    }

    return results;
  }

  async getSortedSiblings(parentPath: string, sortByCount = false): Promise<string[]> {
    const listing = await this.listDirectory(parentPath);
    const dirs = [...listing.directories];

    if (sortByCount) {
      dirs.sort((a, b) => (b.childCount ?? 0) - (a.childCount ?? 0));
    } else {
      dirs.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }));
    }

    return dirs.map((d) => d.path);
  }

  /**
   * Download file content from ZeroStorage download endpoint.
   */
  async getFileBlob(path: string, fileName: string): Promise<Blob> {
    const normalizedPath = path.replace(/^\/+|\/+$/g, '');
    const fullPath = normalizedPath ? `${normalizedPath}/${fileName}` : fileName;
    let fileId = this.fileIdMap.get(fullPath) || this.fileIdMap.get(fileName);

    if (!fileId) {
      const folderId = await this.resolveFolderId(normalizedPath);
      await this.fetchFilesForFolder(folderId, normalizedPath);
      fileId = this.fileIdMap.get(fullPath) || this.fileIdMap.get(fileName);
    }

    if (!fileId) {
      throw new Error(`File not found: ${fullPath}`);
    }

    const url = `${this.apiBaseUrl}/files/download/${fileId}`;
    const headers: HeadersInit = {
      Accept: '*/*',
    };
    if (this.config?.apiKey) {
      headers['x-api-key'] = this.config.apiKey;
    }

    const resp = await this.fetchWithRateLimit(url, { headers });
    if (!resp.ok) {
      throw new Error(`Failed to download file from ZeroStorage (${resp.status}): ${resp.statusText}`);
    }
    return await resp.blob();
  }

  async moveToTrash(path: string, fileName?: string): Promise<boolean> {
    const normalizedPath = path.replace(/^\/+|\/+$/g, '');

    try {
      if (fileName) {
        const fullPath = normalizedPath ? `${normalizedPath}/${fileName}` : fileName;
        let fileId = this.fileIdMap.get(fullPath);
        if (!fileId) {
          const folderId = await this.resolveFolderId(normalizedPath);
          await this.fetchFilesForFolder(folderId, normalizedPath);
          fileId = this.fileIdMap.get(fullPath);
        }
        if (!fileId) return false;

        await this.request(`/files/${fileId}`, {
          method: 'DELETE',
        });
        this.invalidateCache();
        return true;
      } else {
        const folderId = await this.resolveFolderId(normalizedPath);
        if (!folderId) return false;

        await this.request(`/folders/${folderId}?deleteFiles=true`, {
          method: 'DELETE',
        });
        this.invalidateCache();
        return true;
      }
    } catch (err) {
      console.error('ZeroStorage delete failed:', err);
      return false;
    }
  }
}
