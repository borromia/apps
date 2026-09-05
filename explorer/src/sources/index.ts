import { StorageSource } from '../types/source';
import { FileSystemSource } from './FileSystemSource';
import { S3StorageSource } from './S3StorageSource';
import { ZeroStorageSource } from './ZeroStorageSource';

export * from './types';
export * from './FileSystemSource';
export * from './S3StorageSource';
export * from './ZeroStorageSource';

export class SourceRegistry {
  private sources: Map<string, StorageSource> = new Map();

  constructor() {
    const fsSource = new FileSystemSource();
    const s3Source = new S3StorageSource();
    const zeroSource = new ZeroStorageSource();
    this.sources.set(fsSource.id, fsSource);
    this.sources.set(s3Source.id, s3Source);
    this.sources.set(zeroSource.id, zeroSource);
  }

  register(source: StorageSource): void {
    this.sources.set(source.id, source);
  }

  get(id: string): StorageSource | undefined {
    return this.sources.get(id);
  }

  getAll(): StorageSource[] {
    return Array.from(this.sources.values());
  }
}

export const sourceRegistry = new SourceRegistry();

