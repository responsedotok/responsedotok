/**
 * Mirrors the song_visibility enum in 0001-init.sql.
 * - private:    owner + invited collaborators only
 * - collective: shared with a collective (not exposed in the lean v1 UI)
 * - public:     visible to anyone, including signed-out visitors
 */
export type SongVisibility = 'private' | 'collective' | 'public';
