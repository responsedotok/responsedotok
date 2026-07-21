-- ============================================================
-- SONG COLLABORATION (lean per-song model)
-- ============================================================
-- Additive migration layered on top of 0001-init.sql. It adds the
-- pieces the base schema is missing for the "lean project +
-- tracks" product:
--
--   1. song_collaborator — per-song access grants. The base
--      schema only grants song access through collectives
--      (song_collective_access); this table lets an owner invite
--      a specific person to contribute to one song directly.
--
--   2. song.share_token — an unguessable, URL-safe token so an
--      owner can share a project by link, not only by username.
--      Reuses the press_kit token format/discipline.
--
--   3. track.uploaded_by — per-track attribution ("added by
--      Sam"). The base schema attributes contributions at the
--      version level (version.created_by); the lean UI shows a
--      flat list of tracks under one working version, so it needs
--      attribution on the track itself.
--
-- Nothing here is destructive: one new table and two nullable
-- column additions. press_kit and the rest of 0001-init.sql are
-- untouched.
-- ============================================================


-- ============================================================
-- ENUM: song_collaborator_role
-- 'contributor' can add/manage tracks; 'viewer' has read access
-- to a private song without contributing. Default 'contributor'
-- since the core flow is collaborative upload.
-- ============================================================

CREATE TYPE song_collaborator_role AS ENUM ('viewer', 'contributor');


-- ============================================================
-- SONG: share_token
-- Nullable — only populated once the owner enables link sharing.
-- UNIQUE allows many NULLs (Postgres treats NULLs as distinct)
-- while guaranteeing at most one song per non-null token.
-- ============================================================

ALTER TABLE song
  ADD COLUMN IF NOT EXISTS share_token TEXT;

ALTER TABLE song
  ADD CONSTRAINT song_share_token_uq UNIQUE (share_token);

ALTER TABLE song
  ADD CONSTRAINT song_share_token_format_ck
    CHECK (share_token IS NULL OR share_token ~ '^[A-Za-z0-9_-]{16,64}$');


-- ============================================================
-- TRACK: uploaded_by
-- Nullable FK to "user". NULL is tolerated for tracks that
-- predate this column or are created by system flows; the UI
-- falls back to the version's created_by for attribution.
-- ON DELETE SET NULL — deleting a user preserves the track (and
-- the song it belongs to) while dropping the attribution, in
-- line with the soft-delete/attribution philosophy in 0001-init.sql.
-- ============================================================

ALTER TABLE track
  ADD COLUMN IF NOT EXISTS uploaded_by UUID;

ALTER TABLE track
  ADD CONSTRAINT track_uploaded_by_fk
    FOREIGN KEY (uploaded_by) REFERENCES "user"(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS track_uploaded_by_idx
  ON track (uploaded_by)
  WHERE uploaded_by IS NOT NULL;


-- ============================================================
-- SONG COLLABORATOR
-- Row existence = this user may access this song per `role`.
-- The song owner is NOT stored here (owner lives on song.owner_id);
-- this table is only for invited collaborators.
--
-- invited_by is retained for audit / UI ("invited by Adam").
-- UNIQUE (song_id, user_id) makes membership idempotent — a
-- repeat invite is an upsert, never a duplicate row.
-- ============================================================

CREATE TABLE song_collaborator (
  song_id    UUID                    NOT NULL,
  user_id    UUID                    NOT NULL,
  role       song_collaborator_role  NOT NULL DEFAULT 'contributor',
  invited_by UUID,
  created_at TIMESTAMPTZ             NOT NULL DEFAULT NOW(),

  CONSTRAINT song_collaborator_pk
    PRIMARY KEY (song_id, user_id),

  CONSTRAINT song_collaborator_song_id_fk
    FOREIGN KEY (song_id) REFERENCES song(id) ON DELETE CASCADE,
  CONSTRAINT song_collaborator_user_id_fk
    FOREIGN KEY (user_id) REFERENCES "user"(id) ON DELETE CASCADE,
  CONSTRAINT song_collaborator_invited_by_fk
    FOREIGN KEY (invited_by) REFERENCES "user"(id) ON DELETE SET NULL
);

-- For "which songs am I a collaborator on?" (the projects list).
CREATE INDEX song_collaborator_user_id_idx
  ON song_collaborator (user_id);
