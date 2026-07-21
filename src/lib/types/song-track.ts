import type { TrackType } from './track-type';

/**
 * A track within a project's working version, joined to its audio file (if any)
 * and the user who uploaded it. audio fields are null for a track whose upload
 * has not completed.
 */
export type SongTrack = {
  id: string;
  name: string;
  type: TrackType;
  order: number;
  uploaded_by: string | null;
  uploader_name: string | null;
  storage_path: string | null;
  filename: string | null;
  mime_type: string | null;
  duration_ms: number | null;
};
