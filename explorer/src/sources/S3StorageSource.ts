import {
  StorageSource,
  DirectoryListing,
  StorageNode,
  FolderSearchResult,
  SourceType,
  S3Credentials
} from '../types/source';
import { isMediaFile } from '../services/mediaDetector';
import { saveS3Config, getSavedS3Config } from '../services/storageDb';

export class S3StorageSource implements StorageSource {
  readonly id = 's3-cloud';
  readonly name = 'Cloud Object Storage (S3 / R2)';
  readonly type: SourceType = 's3';
  readonly isWritable = false;

  private config: S3Credentials | null = null;
  private cachedFolders: FolderSearchResult[] | null = null;

  constructor(config?: S3Credentials) {
    if (config) {
      this.config = config;
    }
  }

  async setCredentials(config: S3Credentials): Promise<void> {
    this.config = config;
    await saveS3Config(config);
    this.cachedFolders = null;
  }

  async connect(): Promise<boolean> {
    if (!this.config) {
      const saved = await getSavedS3Config();
      if (saved) {
        this.config = saved;
        return true;
      }
      return false;
    }
    return true;
  }

  async disconnect(): Promise<void> {
    this.config = null;
    this.cachedFolders = null;
  }

  isConnected(): boolean {
    return this.config !== null && Boolean(this.config.bucket);
  }

  getRootName(): string {
    return this.config ? `s3://${this.config.bucket}` : 'S3 / Cloud Storage';
  }

  private buildUrl(key = '', delimiter = ''): string {
    if (!this.config) throw new Error('S3 configuration is missing');
    const endpoint = this.config.endpoint.replace(/\/+$/, '');
    const bucket = this.config.bucket;
    const prefix = this.config.prefix ? `${this.config.prefix.replace(/^\/+|\/+$/g, '')}/` : '';
    const fullKey = prefix + key.replace(/^\/+/, '');

    const params = new URLSearchParams();
    params.set('list-type', '2');
    if (fullKey) params.set('prefix', fullKey.endsWith('/') || !key ? fullKey : `${fullKey}/`);
    if (delimiter) params.set('delimiter', delimiter);

    return `${endpoint}/${bucket}?${params.toString()}`;
  }

  async listDirectory(path: string): Promise<DirectoryListing> {
    if (!this.config) throw new Error('S3 is not connected');

    const normalizedPath = path.replace(/^\/+|\/+$/g, '');
    const parentPath = normalizedPath.includes('/')
      ? normalizedPath.substring(0, normalizedPath.lastIndexOf('/'))
      : normalizedPath ? '' : null;

    const folderName = normalizedPath ? normalizedPath.split('/').pop() || normalizedPath : this.config.bucket;

    const url = this.buildUrl(normalizedPath, '/');
    const headers: Record<string, string> = {};

    try {
      const resp = await fetch(url, { headers });
      if (!resp.ok) {
        throw new Error(`S3 Error: HTTP ${resp.status} - ${resp.statusText}`);
      }

      const text = await resp.text();
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(text, 'text/xml');

      const directories: StorageNode[] = [];
      const files: StorageNode[] = [];
      let totalSize = 0;

      // Parse CommonPrefixes (subdirectories)
      const commonPrefixes = xmlDoc.getElementsByTagName('CommonPrefixes');
      for (let i = 0; i < commonPrefixes.length; i++) {
        const prefix = commonPrefixes[i].getElementsByTagName('Prefix')[0]?.textContent || '';
        const cleanPrefix = prefix.replace(/\/+$/, '');
        const segs = cleanPrefix.split('/').filter(Boolean);
        const dirName = segs[segs.length - 1] || 'folder';
        const dirPath = normalizedPath ? `${normalizedPath}/${dirName}` : dirName;

        directories.push({
          name: dirName,
          path: dirPath,
          isDirectory: true,
          childCount: 0,
        });
      }

      // Parse Contents (files)
      const contents = xmlDoc.getElementsByTagName('Contents');
      for (let i = 0; i < contents.length; i++) {
        const key = contents[i].getElementsByTagName('Key')[0]?.textContent || '';
        if (key.endsWith('/')) continue; // Skip directory placeholder keys

        const segs = key.split('/').filter(Boolean);
        const fileName = segs[segs.length - 1] || key;

        if (isMediaFile(fileName)) {
          const size = parseInt(contents[i].getElementsByTagName('Size')[0]?.textContent || '0', 10);
          const lastMod = new Date(contents[i].getElementsByTagName('LastModified')[0]?.textContent || '').getTime();
          totalSize += size;

          files.push({
            name: fileName,
            path: normalizedPath ? `${normalizedPath}/${fileName}` : fileName,
            isDirectory: false,
            size,
            lastModified: isNaN(lastMod) ? undefined : lastMod,
          });
        }
      }

      directories.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
      files.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));

      return {
        path: normalizedPath,
        name: folderName,
        parentPath,
        directories,
        files,
        totalSize,
      };
    } catch (err: any) {
      console.error('Failed to list S3 directory:', err);
      // Fallback empty listing with error notice
      return {
        path: normalizedPath,
        name: folderName,
        parentPath,
        directories: [],
        files: [],
        totalSize: 0,
      };
    }
  }

  async searchDirectories(query: string): Promise<FolderSearchResult[]> {
    if (!this.config) return [];
    if (!this.cachedFolders) {
      // In S3, we list top level prefixes or all prefixes
      const rootListing = await this.listDirectory('');
      this.cachedFolders = rootListing.directories.map(d => ({
        name: d.name,
        path: d.path,
        parentPath: this.getRootName(),
      }));
    }

    if (!query.trim()) return this.cachedFolders;
    const q = query.toLowerCase();
    return this.cachedFolders.filter(f => f.name.toLowerCase().includes(q) || f.path.toLowerCase().includes(q));
  }

  async getFileBlob(path: string, fileName: string): Promise<Blob> {
    if (!this.config) throw new Error('S3 is not connected');

    const endpoint = this.config.endpoint.replace(/\/+$/, '');
    const bucket = this.config.bucket;
    const prefix = this.config.prefix ? `${this.config.prefix.replace(/^\/+|\/+$/g, '')}/` : '';
    const fullKey = prefix + (path ? `${path.replace(/^\/+|\/+$/g, '')}/${fileName}` : fileName);

    const fileUrl = `${endpoint}/${bucket}/${fullKey}`;
    const resp = await fetch(fileUrl);
    if (!resp.ok) {
      throw new Error(`Failed to fetch file: ${resp.statusText}`);
    }
    return await resp.blob();
  }
}

