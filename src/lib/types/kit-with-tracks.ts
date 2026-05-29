import type { KitTrack } from '@/lib/types/kit-track';

export type KitWithTracks = {
  id: string;
  artist_name: string;
  recipient_name: string;
  recipient_org: string | null;
  greeting: string;
  pitch: string;
  created_at: Date;
  tracks: KitTrack[];
};
