import { MediaType } from '../types/media';

const IMAGE_EXTENSIONS = new Set([
  'jpg', 'jpeg', 'png', 'gif', 'webp', 'avif', 'bmp', 'svg'
]);

const VIDEO_EXTENSIONS = new Set([
  'mp4', 'webm', 'mov', 'mkv', 'avi', 'm4v', 'ogv'
]);

const PDF_EXTENSIONS = new Set(['pdf']);

export function getFileExtension(filename: string): string {
  const lastDot = filename.lastIndexOf('.');
  if (lastDot === -1) return '';
  return filename.slice(lastDot + 1).toLowerCase();
}

export function detectMediaType(filename: string): MediaType {
  const ext = getFileExtension(filename);
  if (IMAGE_EXTENSIONS.has(ext)) return 'image';
  if (VIDEO_EXTENSIONS.has(ext)) return 'video';
  if (PDF_EXTENSIONS.has(ext)) return 'pdf';
  return 'other';
}

export function isMediaFile(filename: string): boolean {
  return detectMediaType(filename) !== 'other';
}

export function getMimeType(filename: string): string {
  const ext = getFileExtension(filename);
  switch (ext) {
    case 'jpg':
    case 'jpeg': return 'image/jpeg';
    case 'png': return 'image/png';
    case 'gif': return 'image/gif';
    case 'webp': return 'image/webp';
    case 'avif': return 'image/avif';
    case 'bmp': return 'image/bmp';
    case 'svg': return 'image/svg+xml';
    case 'mp4': return 'video/mp4';
    case 'webm': return 'video/webm';
    case 'mov': return 'video/quicktime';
    case 'mkv': return 'video/x-matroska';
    case 'avi': return 'video/x-msvideo';
    case 'pdf': return 'application/pdf';
    default: return 'application/octet-stream';
  }
}

export function formatFileSize(bytes?: number): string {
  if (bytes === undefined || bytes === null || isNaN(bytes)) return '0 B';
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

