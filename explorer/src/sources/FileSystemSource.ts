import {
  StorageSource,
  DirectoryListing,
  StorageNode,
  FolderSearchResult,
  SourceType
} from '../types/source';
import { isMediaFile } from '../services/mediaDetector';
import { saveFileSystemHandle, getSavedFileSystemHandle, clearSavedFileSystemHandle } from '../services/storageDb';

export class FileSystemSource implements StorageSource {
  readonly id = 'local-fs';
  readonly name = 'Local File System';
  readonly type: SourceType = 'filesystem';
  readonly isWritable = true;

  private rootHandle: FileSystemDirectoryHandle | null = null;
  private cachedFolders: FolderSearchResult[] | null = null;

  constructor(existingHandle?: FileSystemDirectoryHandle) {
    if (existingHandle) {
      this.rootHandle = existingHandle;
    }
  }

  async connect(forcePicker = false): Promise<boolean> {
    try {
      if (forcePicker) {
        if (typeof window !== 'undefined' && 'showDirectoryPicker' in window) {
          const handle = await (window as any).showDirectoryPicker({
            mode: 'readwrite',
          });
          this.rootHandle = handle;
          await saveFileSystemHandle(handle);
          this.cachedFolders = null;
          return true;
        } else {
          alert('File System Access API is not supported in this browser. Please use Chrome or Edge.');
          return false;
        }
      }

      if (!this.rootHandle) {
        // Try restoring from IndexedDB
        const saved = await getSavedFileSystemHandle();
        if (saved) {
          // Check or request permission
          const perm = await (saved as any).queryPermission?.({ mode: 'readwrite' }) ?? 'granted';
          if (perm === 'granted') {
            this.rootHandle = saved;
            return true;
          }
        }

        // Prompt user
        if (typeof window !== 'undefined' && 'showDirectoryPicker' in window) {
          const handle = await (window as any).showDirectoryPicker({
            mode: 'readwrite',
          });
          this.rootHandle = handle;
          await saveFileSystemHandle(handle);
          this.cachedFolders = null;
          return true;
        } else {
          alert('File System Access API is not supported in this browser. Please use Chrome or Edge.');
          return false;
        }
      }
      return true;
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        console.error('Error connecting to File System:', err);
      }
      return false;
    }
  }

  async disconnect(): Promise<void> {
    this.rootHandle = null;
    this.cachedFolders = null;
    await clearSavedFileSystemHandle();
  }

  isConnected(): boolean {
    return this.rootHandle !== null;
  }

  getRootName(): string {
    return this.rootHandle ? this.rootHandle.name : 'No Folder Selected';
  }

  private async resolveDirHandle(path: string): Promise<FileSystemDirectoryHandle> {
    if (!this.rootHandle) throw new Error('File system source is not connected.');
    if (!path || path === '.' || path === '/') return this.rootHandle;

    const segments = path.split('/').filter(Boolean);
    let current = this.rootHandle;

    for (const segment of segments) {
      current = await current.getDirectoryHandle(segment, { create: false });
    }

    return current;
  }

  async listDirectory(path: string): Promise<DirectoryListing> {
    const dirHandle = await this.resolveDirHandle(path);
    const normalizedPath = path.replace(/^\/+|\/+$/g, '');
    const parentPath = normalizedPath.includes('/')
      ? normalizedPath.substring(0, normalizedPath.lastIndexOf('/'))
      : normalizedPath ? '' : null;

    const directories: StorageNode[] = [];
    const files: StorageNode[] = [];
    let totalSize = 0;

    // Collect all entries
    for await (const [name, handle] of (dirHandle as any).entries()) {
      if (name.startsWith('.') || name === 'trash') continue;

      const itemPath = normalizedPath ? `${normalizedPath}/${name}` : name;

      if (handle.kind === 'directory') {
        // Count media children inside this directory
        let count = 0;
        try {
          for await (const [childName, childHandle] of (handle as any).entries()) {
            if (!childName.startsWith('.') && childHandle.kind === 'file' && isMediaFile(childName)) {
              count++;
            }
          }
        } catch {
          // ignore permission or read errors for child counting
        }

        directories.push({
          name,
          path: itemPath,
          isDirectory: true,
          childCount: count,
          handle,
        });
      } else if (handle.kind === 'file') {
        if (isMediaFile(name)) {
          let size = 0;
          let lastModified = 0;
          try {
            const file = await (handle as FileSystemFileHandle).getFile();
            size = file.size;
            lastModified = file.lastModified;
            totalSize += size;
          } catch {
            // ignore
          }

          files.push({
            name,
            path: itemPath,
            isDirectory: false,
            size,
            lastModified,
            handle,
          });
        }
      }
    }

    // Natural sort: directories by name, files naturally by name
    directories.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }));
    files.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }));

    return {
      path: normalizedPath,
      name: dirHandle.name,
      parentPath,
      directories,
      files,
      totalSize,
    };
  }

  async searchDirectories(query: string): Promise<FolderSearchResult[]> {
    if (!this.rootHandle) return [];

    if (!this.cachedFolders) {
      const results: FolderSearchResult[] = [];
      const traverse = async (handle: FileSystemDirectoryHandle, currentPath: string) => {
        for await (const [name, child] of (handle as any).entries()) {
          if (name.startsWith('.') || name === 'trash') continue;
          if (child.kind === 'directory') {
            const childPath = currentPath ? `${currentPath}/${name}` : name;
            results.push({
              name,
              path: childPath,
              parentPath: currentPath || this.rootHandle!.name,
            });
            await traverse(child as FileSystemDirectoryHandle, childPath);
          }
        }
      };

      await traverse(this.rootHandle, '');
      this.cachedFolders = results;
    }

    if (!query.trim()) {
      return this.cachedFolders;
    }

    const q = query.toLowerCase();
    return this.cachedFolders.filter(f => f.name.toLowerCase().includes(q) || f.path.toLowerCase().includes(q));
  }

  async getSortedSiblings(parentPath: string, sortByCount = false): Promise<string[]> {
    const listing = await this.listDirectory(parentPath);
    const dirs = [...listing.directories];

    if (sortByCount) {
      dirs.sort((a, b) => (b.childCount ?? 0) - (a.childCount ?? 0));
    } else {
      dirs.sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }));
    }

    return dirs.map(d => d.path);
  }

  async getFileBlob(path: string, fileName: string): Promise<Blob> {
    const dirHandle = await this.resolveDirHandle(path);
    const fileHandle = await dirHandle.getFileHandle(fileName);
    const file = await fileHandle.getFile();
    return file;
  }

  async moveToTrash(path: string, fileName?: string): Promise<boolean> {
    if (!this.rootHandle) return false;

    // Ensure readwrite permission
    if ((this.rootHandle as any).requestPermission) {
      const perm = await (this.rootHandle as any).requestPermission({ mode: 'readwrite' });
      if (perm !== 'granted') return false;
    }

    const normalizedPath = path.replace(/^\/+|\/+$/g, '');

    // Get or create trash root
    const trashRoot = await this.rootHandle.getDirectoryHandle('trash', { create: true });

    if (fileName) {
      // Move single file
      const sourceDir = await this.resolveDirHandle(normalizedPath);
      const sourceFileHandle = await sourceDir.getFileHandle(fileName);
      const fileData = await (await sourceFileHandle.getFile()).arrayBuffer();

      // Create destination folder in trash
      let targetTrashDir = trashRoot;
      if (normalizedPath) {
        const segments = normalizedPath.split('/').filter(Boolean);
        for (const seg of segments) {
          targetTrashDir = await targetTrashDir.getDirectoryHandle(seg, { create: true });
        }
      }

      const destFileHandle = await targetTrashDir.getFileHandle(fileName, { create: true });
      const writable = await (destFileHandle as any).createWritable();
      await writable.write(fileData);
      await writable.close();

      // Remove from source
      await sourceDir.removeEntry(fileName);
      return true;
    } else {
      // Move whole directory
      const segments = normalizedPath.split('/').filter(Boolean);
      if (segments.length === 0) return false;

      const targetFolderName = segments[segments.length - 1];
      const parentPath = segments.slice(0, -1).join('/');
      const parentDir = await this.resolveDirHandle(parentPath);
      const sourceDir = await parentDir.getDirectoryHandle(targetFolderName);

      // Copy directory recursively to trash
      let targetTrashParent = trashRoot;
      if (parentPath) {
        for (const seg of parentPath.split('/').filter(Boolean)) {
          targetTrashParent = await targetTrashParent.getDirectoryHandle(seg, { create: true });
        }
      }
      const targetTrashDir = await targetTrashParent.getDirectoryHandle(targetFolderName, { create: true });

      await this.copyDirRecursive(sourceDir, targetTrashDir);

      // Remove from parent
      await parentDir.removeEntry(targetFolderName, { recursive: true });
      this.cachedFolders = null; // invalidate search cache
      return true;
    }
  }

  private async copyDirRecursive(source: FileSystemDirectoryHandle, destination: FileSystemDirectoryHandle) {
    for await (const [name, handle] of (source as any).entries()) {
      if (handle.kind === 'directory') {
        const subDest = await destination.getDirectoryHandle(name, { create: true });
        await this.copyDirRecursive(handle as FileSystemDirectoryHandle, subDest);
      } else if (handle.kind === 'file') {
        const file = await (handle as FileSystemFileHandle).getFile();
        const buf = await file.arrayBuffer();
        const destFile = await destination.getFileHandle(name, { create: true });
        const wr = await (destFile as any).createWritable();
        await wr.write(buf);
        await wr.close();
      }
    }
  }
}

