import type { SongVisibility } from './song-visibility';

/**
 * The resolved access a given user has to a given song. Returned by
 * getSongAccess; the boolean flags are derived once so callers never
 * re-implement the authorization rules.
 */
export type SongAccess = {
  songId: string;
  isOwner: boolean;
  /** Collaborator role, or null if the user is not a collaborator. */
  role: 'viewer' | 'contributor' | null;
  visibility: SongVisibility;
  canView: boolean;
  canContribute: boolean;
};
