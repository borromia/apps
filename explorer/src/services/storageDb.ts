import { get, set, del } from 'idb-keyval';
import { S3Credentials } from '../types/source';

const KEYS = {
  FS_ROOT_HANDLE: 'explorer_fs_handle',
  ACTIVE_SOURCE_ID: 'explorer_active_source_id',
  S3_CONFIG: 'explorer_s3_config',
  TAGS_PREFIX: 'tags:',
  READER_SETTINGS: 'explorer_reader_settings',
  LAST_PATH: 'explorer_last_path',
};

export async function saveFileSystemHandle(handle: FileSystemDirectoryHandle): Promise<void> {
  await set(KEYS.FS_ROOT_HANDLE, handle);
}

export async function getSavedFileSystemHandle(): Promise<FileSystemDirectoryHandle | undefined> {
  return await get<FileSystemDirectoryHandle>(KEYS.FS_ROOT_HANDLE);
}

export async function clearSavedFileSystemHandle(): Promise<void> {
  await del(KEYS.FS_ROOT_HANDLE);
}

export async function saveS3Config(config: S3Credentials): Promise<void> {
  await set(KEYS.S3_CONFIG, config);
}

export async function getSavedS3Config(): Promise<S3Credentials | undefined> {
  return await get<S3Credentials>(KEYS.S3_CONFIG);
}

export async function saveFolderTags(path: string, tags: string[]): Promise<void> {
  await set(`${KEYS.TAGS_PREFIX}${path}`, tags);
}

export async function getFolderTags(path: string): Promise<string[] | undefined> {
  return await get<string[]>(`${KEYS.TAGS_PREFIX}${path}`);
}

export async function saveLastPath(path: string): Promise<void> {
  await set(KEYS.LAST_PATH, path);
}

export async function getLastPath(): Promise<string | undefined> {
  return await get<string>(KEYS.LAST_PATH);
}

