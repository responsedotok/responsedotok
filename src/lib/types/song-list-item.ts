import type { SongVisibility } from './song-visibility';

export type SongListItem = {
  id: string;
  title: string;
  genre: string | null;
  visibility: SongVisibility;
  created_at: Date;
  updated_at: Date;
  is_owner: boolean;
  track_count: number;
};
