export type GenreTag =
  | 'action'
  | 'romance'
  | 'comedy'
  | 'horror'
  | 'fantasy'
  | 'sci-fi'
  | 'slice-of-life'
  | 'adventure'
  | 'drama';

export interface OcrProgress {
  status: 'idle' | 'running' | 'completed' | 'error';
  currentPage: number;
  totalPages: number;
  currentFilename?: string;
  errorMessage?: string;
}

export interface FolderTags {
  path: string;
  tags: string[];
  lastUpdated: number;
}

