export type ViewMode = 'tiles' | 'comic';

export type SortMode = 'name' | 'count';

export interface ReaderSettings {
  viewMode: ViewMode;
  sortMode: SortMode;
  zoom: number; // 0.5 to 3.0
  videoSpeed: number; // 0.5 to 5.0
  sidebarWidth: number;
}

