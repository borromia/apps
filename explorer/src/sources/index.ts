import { StorageSource } from '../types/source';
import { FileSystemSource } from './FileSystemSource';
import { S3StorageSource } from './S3StorageSource';

export * from './types';
export * from './FileSystemSource';
export * from './S3StorageSource';

export class SourceRegistry {
  private sources: Map<string, StorageSource> = new Map();

  constructor() {
    const fsSource = new FileSystemSource();
    const s3Source = new S3StorageSource();
    this.sources.set(fsSource.id, fsSource);
    this.sources.set(s3Source.id, s3Source);
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

