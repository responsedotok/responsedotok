import type { SongTrack } from './song-track';
import type { SongVisibility } from './song-visibility';

export type SongDetail = {
  id: string;
  title: string;
  genre: string | null;
  description: string | null;
  visibility: SongVisibility;
  owner_id: string;
  owner_name: string;
  share_token: string | null;
  created_at: Date;
  updated_at: Date;
  tracks: SongTrack[];
};
