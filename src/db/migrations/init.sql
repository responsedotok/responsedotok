-- ============================================================
-- Music Collaboration Platform — PostgreSQL DDL
-- ============================================================
-- Dependency order:
--   ENUMs → updated_at trigger → user → session → collective
--   → collective_membership → collective_invite → song
--   → song_collective_access → branch → version → track
--   → audio_file → comment_thread → comment
-- ============================================================


-- ============================================================
-- ENUM TYPES
-- ALTER TYPE <name> ADD VALUE '<value>';
-- ============================================================

CREATE TYPE collective_type AS ENUM ('group', 'band');
CREATE TYPE membership_role AS ENUM ('owner', 'admin', 'member');
CREATE TYPE invite_role     AS ENUM ('admin', 'member');
CREATE TYPE invite_status   AS ENUM ('pending', 'accepted', 'declined', 'expired', 'revoked');
CREATE TYPE song_visibility AS ENUM ('private', 'collective', 'public');
CREATE TYPE track_type      AS ENUM ('mix', 'stem');
CREATE TYPE comment_scope   AS ENUM ('public', 'collective');

CREATE TYPE audio_mime_type AS ENUM (
  'audio/wav',
  'audio/mpeg',
  'audio/flac',
  'audio/aac',
  'audio/ogg',
  'audio/x-m4a',
  'audio/webm'
);


-- ============================================================
-- UPDATED_AT TRIGGER
-- Attached to any table with an updated_at column.
-- ============================================================

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- ============================================================
-- USER
-- "user" is reserved in PostgreSQL — always quote it.
--
-- Identity only — credentials live in password_credential (and
-- eventually oauth_account). A user with no password_credential
-- row and no oauth_account row cannot sign in. This separation
-- keeps the user table auth-method-agnostic and makes adding
-- OAuth a pure additive change later.
--
-- username/email are normalized to lowercase at the application
-- layer; CHECK constraints enforce the invariant at the DB layer.
--
-- deleted_at is the soft-delete marker. On account deletion, the
-- app nulls PII (display_name → 'deleted user'; email/avatar_url
-- /bio → NULL or placeholder), DELETEs the password_credential
-- row, and DELETEs all sessions — but keeps the user row to
-- preserve attribution on comments, versions, songs, etc.
-- ============================================================

CREATE TABLE "user" (
  id                UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  username          TEXT         NOT NULL,
  email             TEXT         NOT NULL,
  display_name      TEXT         NOT NULL,
  avatar_url        TEXT,
  bio               TEXT,
  email_verified_at TIMESTAMPTZ,
  deleted_at        TIMESTAMPTZ,
  created_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

  CONSTRAINT user_username_uq             UNIQUE (username),
  CONSTRAINT user_email_uq                UNIQUE (email),
  CONSTRAINT user_username_lowercase_ck   CHECK  (username = lower(username)),
  CONSTRAINT user_email_lowercase_ck      CHECK  (email = lower(email)),
  CONSTRAINT user_username_format_ck      CHECK  (username ~ '^[a-z0-9_]{3,32}$'),
  CONSTRAINT user_email_format_ck         CHECK  (email ~ '^[^@[:space:]]+@[^@[:space:]]+\.[^@[:space:]]+$'),
  CONSTRAINT user_display_name_length_ck  CHECK  (length(display_name) BETWEEN 1 AND 100),
  CONSTRAINT user_bio_length_ck           CHECK  (bio IS NULL OR length(bio) <= 2000),
  CONSTRAINT user_avatar_url_length_ck    CHECK  (avatar_url IS NULL OR length(avatar_url) <= 500)
);

CREATE TRIGGER user_set_updated_at
  BEFORE UPDATE ON "user"
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- ============================================================
-- PASSWORD CREDENTIAL
-- ============================================================
-- Stores the argon2id hash for password-based authentication.
-- One row per user, optional. A user with no row here cannot
-- sign in with a password.
--
-- This table is separate from "user" deliberately:
--   - When OAuth ships, add an oauth_account table alongside
--     this one. user remains unchanged.
--   - On account soft-delete, this row is DELETEd outright
--     (no soft-delete needed — credentials are not attribution).
-- ============================================================

CREATE TABLE password_credential (
  user_id       UUID         PRIMARY KEY,
  password_hash TEXT         NOT NULL,
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

  CONSTRAINT password_credential_user_id_fk
    FOREIGN KEY (user_id) REFERENCES "user"(id) ON DELETE CASCADE
);

CREATE TRIGGER password_credential_set_updated_at
  BEFORE UPDATE ON password_credential
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- ============================================================
-- EMAIL VERIFICATION TOKEN
-- ============================================================
-- Same storage discipline as session: id is SHA-256 hex digest
-- (64 chars) of the raw token. The raw token lives only in the
-- email link sent to the user; never in the DB.
--
-- email is captured at issuance time so a verification link
-- continues to verify the email it was sent to even if the
-- user changes user.email afterwards (closing a window where
-- a typoed-then-corrected email could be incorrectly verified).
--
-- used_at marks single-use redemption — a token is valid only
-- if used_at IS NULL AND expires_at > NOW().
-- ============================================================

CREATE TABLE email_verification_token (
  id         TEXT         PRIMARY KEY,
  user_id    UUID         NOT NULL,
  email      TEXT         NOT NULL,
  expires_at TIMESTAMPTZ  NOT NULL,
  used_at    TIMESTAMPTZ,
  created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

  CONSTRAINT email_verification_token_id_format_ck       CHECK (id ~ '^[a-f0-9]{64}$'),
  CONSTRAINT email_verification_token_email_lowercase_ck CHECK (email = lower(email)),
  CONSTRAINT email_verification_token_expires_after_created_ck CHECK (expires_at > created_at),

  CONSTRAINT email_verification_token_user_id_fk
    FOREIGN KEY (user_id) REFERENCES "user"(id) ON DELETE CASCADE
);

-- Active (unused) tokens by user — for invalidating outstanding
-- tokens when a new one is issued, and for cleanup queries.
CREATE INDEX email_verification_token_user_active_idx
  ON email_verification_token (user_id)
  WHERE used_at IS NULL;


-- ============================================================
-- PASSWORD RESET TOKEN
-- ============================================================
-- Same pattern as email_verification_token.
-- ============================================================

CREATE TABLE password_reset_token (
  id         TEXT         PRIMARY KEY,
  user_id    UUID         NOT NULL,
  expires_at TIMESTAMPTZ  NOT NULL,
  used_at    TIMESTAMPTZ,
  created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

  CONSTRAINT password_reset_token_id_format_ck            CHECK (id ~ '^[a-f0-9]{64}$'),
  CONSTRAINT password_reset_token_expires_after_created_ck CHECK (expires_at > created_at),

  CONSTRAINT password_reset_token_user_id_fk
    FOREIGN KEY (user_id) REFERENCES "user"(id) ON DELETE CASCADE
);

CREATE INDEX password_reset_token_user_active_idx
  ON password_reset_token (user_id)
  WHERE used_at IS NULL;


-- ============================================================
-- SESSION
-- id is the SHA-256 hex digest (64 chars) of the raw session
-- token. The raw token lives only in the user's HttpOnly cookie
-- and is never stored in the database. A DB leak does not
-- compromise active sessions.
-- ============================================================

CREATE TABLE session (
  id         TEXT         PRIMARY KEY,
  user_id    UUID         NOT NULL,
  expires_at TIMESTAMPTZ  NOT NULL,
  created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

  CONSTRAINT session_id_format_ck CHECK (id ~ '^[a-f0-9]{64}$'),

  CONSTRAINT session_user_id_fk
    FOREIGN KEY (user_id) REFERENCES "user"(id) ON DELETE CASCADE
);

CREATE INDEX session_user_id_idx    ON session (user_id);
CREATE INDEX session_expires_at_idx ON session (expires_at);


-- ============================================================
-- COLLECTIVE
-- slug is globally unique and lowercase. The reserved-slug
-- namespace (paths the app owns: /api, /login, /settings, etc.)
-- is enforced at the application layer before insert.
-- ============================================================

CREATE TABLE collective (
  id          UUID             PRIMARY KEY DEFAULT gen_random_uuid(),
  type        collective_type  NOT NULL,
  name        TEXT             NOT NULL,
  slug        TEXT             NOT NULL,
  description TEXT,
  avatar_url  TEXT,
  is_public   BOOLEAN          NOT NULL DEFAULT false,
  created_by  UUID             NOT NULL,
  created_at  TIMESTAMPTZ      NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ      NOT NULL DEFAULT NOW(),

  CONSTRAINT collective_slug_uq               UNIQUE (slug),
  CONSTRAINT collective_slug_lowercase_ck     CHECK  (slug = lower(slug)),
  CONSTRAINT collective_slug_format_ck        CHECK  (slug ~ '^[a-z0-9][a-z0-9-]{1,63}$'),
  CONSTRAINT collective_name_length_ck        CHECK  (length(name) BETWEEN 1 AND 100),
  CONSTRAINT collective_description_length_ck CHECK  (description IS NULL OR length(description) <= 2000),
  CONSTRAINT collective_avatar_url_length_ck  CHECK  (avatar_url IS NULL OR length(avatar_url) <= 500),

  CONSTRAINT collective_created_by_fk
    FOREIGN KEY (created_by) REFERENCES "user"(id)
);

CREATE TRIGGER collective_set_updated_at
  BEFORE UPDATE ON collective
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Partial index for discovery (only public bands are queried)
CREATE INDEX collective_is_public_idx
  ON collective (created_at DESC)
  WHERE is_public = true AND type = 'band';


-- ============================================================
-- COLLECTIVE MEMBERSHIP
-- At most one owner per collective is enforced by the partial
-- unique index below. Ownership transfer is a two-step app-layer
-- flow (demote old, promote new) inside one transaction.
-- ============================================================

CREATE TABLE collective_membership (
  id            UUID             PRIMARY KEY DEFAULT gen_random_uuid(),
  collective_id UUID             NOT NULL,
  user_id       UUID             NOT NULL,
  role          membership_role  NOT NULL,
  invited_by    UUID,
  joined_at     TIMESTAMPTZ      NOT NULL DEFAULT NOW(),

  CONSTRAINT collective_membership_collective_user_uq
    UNIQUE (collective_id, user_id),

  CONSTRAINT collective_membership_collective_id_fk
    FOREIGN KEY (collective_id) REFERENCES collective(id) ON DELETE CASCADE,
  CONSTRAINT collective_membership_user_id_fk
    FOREIGN KEY (user_id) REFERENCES "user"(id) ON DELETE CASCADE,
  CONSTRAINT collective_membership_invited_by_fk
    FOREIGN KEY (invited_by) REFERENCES "user"(id)
);

CREATE INDEX collective_membership_user_id_idx
  ON collective_membership (user_id);

-- At most one owner per collective
CREATE UNIQUE INDEX collective_membership_one_owner_uq
  ON collective_membership (collective_id)
  WHERE role = 'owner';


-- ============================================================
-- COLLECTIVE INVITE
-- ============================================================

CREATE TABLE collective_invite (
  id              UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
  collective_id   UUID           NOT NULL,
  invited_by      UUID           NOT NULL,
  invitee_email   TEXT           NOT NULL,
  invitee_user_id UUID,
  role            invite_role    NOT NULL,
  token           TEXT           NOT NULL,
  status          invite_status  NOT NULL DEFAULT 'pending',
  expires_at      TIMESTAMPTZ    NOT NULL,
  created_at      TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  responded_at    TIMESTAMPTZ,

  CONSTRAINT collective_invite_token_uq             UNIQUE (token),
  CONSTRAINT collective_invite_email_lowercase_ck   CHECK  (invitee_email = lower(invitee_email)),
  CONSTRAINT collective_invite_expires_after_created_ck CHECK (expires_at > created_at),

  CONSTRAINT collective_invite_collective_id_fk
    FOREIGN KEY (collective_id) REFERENCES collective(id) ON DELETE CASCADE,
  CONSTRAINT collective_invite_invited_by_fk
    FOREIGN KEY (invited_by) REFERENCES "user"(id),
  CONSTRAINT collective_invite_invitee_user_id_fk
    FOREIGN KEY (invitee_user_id) REFERENCES "user"(id)
);

-- For looking up pending invites by email on user registration
CREATE INDEX collective_invite_invitee_email_pending_idx
  ON collective_invite (invitee_email)
  WHERE status = 'pending';

-- Prevent duplicate pending invites for the same (collective, email)
CREATE UNIQUE INDEX collective_invite_pending_dedup_uq
  ON collective_invite (collective_id, invitee_email)
  WHERE status = 'pending';


-- ============================================================
-- SONG
-- Always owned by an individual user. The relationship between
-- songs and collectives lives entirely in song_collective_access
-- — there is no collective_id column on song.
-- ============================================================

CREATE TABLE song (
  id          UUID             PRIMARY KEY DEFAULT gen_random_uuid(),
  title       TEXT             NOT NULL,
  owner_id    UUID             NOT NULL,
  visibility  song_visibility  NOT NULL DEFAULT 'private',
  genre       TEXT,
  description TEXT,
  created_at  TIMESTAMPTZ      NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ      NOT NULL DEFAULT NOW(),

  CONSTRAINT song_title_length_ck       CHECK (length(title) BETWEEN 1 AND 200),
  CONSTRAINT song_genre_length_ck       CHECK (genre IS NULL OR length(genre) <= 50),
  CONSTRAINT song_description_length_ck CHECK (description IS NULL OR length(description) <= 5000),

  CONSTRAINT song_owner_id_fk
    FOREIGN KEY (owner_id) REFERENCES "user"(id)
);

CREATE TRIGGER song_set_updated_at
  BEFORE UPDATE ON song
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX song_owner_id_idx   ON song (owner_id);
CREATE INDEX song_visibility_idx ON song (visibility);

-- For the public discovery feed
CREATE INDEX song_public_created_at_idx
  ON song (created_at DESC)
  WHERE visibility = 'public';


-- ============================================================
-- SONG COLLECTIVE ACCESS
-- Composite PK — row existence is the access grant.
-- Carries granted_by/granted_at for audit and UI display.
-- ============================================================

CREATE TABLE song_collective_access (
  song_id       UUID         NOT NULL,
  collective_id UUID         NOT NULL,
  granted_by    UUID         NOT NULL,
  granted_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

  CONSTRAINT song_collective_access_pk
    PRIMARY KEY (song_id, collective_id),

  CONSTRAINT song_collective_access_song_id_fk
    FOREIGN KEY (song_id) REFERENCES song(id) ON DELETE CASCADE,
  CONSTRAINT song_collective_access_collective_id_fk
    FOREIGN KEY (collective_id) REFERENCES collective(id) ON DELETE CASCADE,
  CONSTRAINT song_collective_access_granted_by_fk
    FOREIGN KEY (granted_by) REFERENCES "user"(id)
);

-- For "what songs can this collective see?"
CREATE INDEX song_collective_access_collective_id_idx
  ON song_collective_access (collective_id);


-- ============================================================
-- BRANCH
-- Exactly one branch per song is marked is_default = true
-- (typically named 'main', created automatically with the song).
-- Enforced by the partial unique index below.
-- ============================================================

CREATE TABLE branch (
  id         UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  song_id    UUID         NOT NULL,
  name       TEXT         NOT NULL,
  is_default BOOLEAN      NOT NULL DEFAULT false,
  created_by UUID         NOT NULL,
  created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

  CONSTRAINT branch_song_name_uq    UNIQUE (song_id, name),
  CONSTRAINT branch_name_format_ck  CHECK (name ~ '^[a-zA-Z0-9][a-zA-Z0-9_/.-]{0,49}$'),

  CONSTRAINT branch_song_id_fk
    FOREIGN KEY (song_id) REFERENCES song(id) ON DELETE CASCADE,
  CONSTRAINT branch_created_by_fk
    FOREIGN KEY (created_by) REFERENCES "user"(id)
);

CREATE INDEX branch_song_id_idx ON branch (song_id);

-- At most one default branch per song
CREATE UNIQUE INDEX branch_song_default_uq
  ON branch (song_id)
  WHERE is_default = true;


-- ============================================================
-- VERSION
-- parent_version_id may reference a version on a *different*
-- branch — this is the branch-point parent. When a new branch
-- is created from an existing version, the first version on the
-- new branch will have parent_version_id pointing back to the
-- source-branch version. This is intentional and is how branch
-- history is traversable across the full song graph.
--
-- parent_version_id is NULL only for the very first version of a
-- song (on its default branch, with no parent).
-- ============================================================

CREATE TABLE version (
  id                UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  branch_id         UUID         NOT NULL,
  parent_version_id UUID,
  label             TEXT,
  description       TEXT,
  created_by        UUID         NOT NULL,
  created_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

  CONSTRAINT version_label_length_ck       CHECK (label IS NULL OR length(label) <= 100),
  CONSTRAINT version_description_length_ck CHECK (description IS NULL OR length(description) <= 2000),

  CONSTRAINT version_branch_id_fk
    FOREIGN KEY (branch_id) REFERENCES branch(id) ON DELETE CASCADE,
  CONSTRAINT version_parent_version_id_fk
    FOREIGN KEY (parent_version_id) REFERENCES version(id),
  CONSTRAINT version_created_by_fk
    FOREIGN KEY (created_by) REFERENCES "user"(id)
);

CREATE INDEX version_branch_id_idx ON version (branch_id);
CREATE INDEX version_parent_version_id_idx
  ON version (parent_version_id)
  WHERE parent_version_id IS NOT NULL;


-- ============================================================
-- TRACK
-- "order" is reserved in PostgreSQL — always quote it.
-- Gapped ordering (10, 20, 30) to allow reordering without
-- a full re-index. Ties on "order" are permitted; the app
-- breaks them by id when rendering.
-- ============================================================

CREATE TABLE track (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  version_id UUID        NOT NULL,
  name       TEXT        NOT NULL DEFAULT 'Full Mix',
  type       track_type  NOT NULL DEFAULT 'mix',
  "order"    INT         NOT NULL DEFAULT 10,

  CONSTRAINT track_name_length_ck CHECK (length(name) BETWEEN 1 AND 100),
  CONSTRAINT track_order_ck       CHECK ("order" >= 0),

  CONSTRAINT track_version_id_fk
    FOREIGN KEY (version_id) REFERENCES version(id) ON DELETE CASCADE
);

CREATE INDEX track_version_id_idx ON track (version_id);


-- ============================================================
-- AUDIO FILE
-- One audio_file per (track_id, mime_type) — a track may have
-- a wav and an mp3 of the same content, but not two mp3s.
-- Replacing a file = delete row, then insert new.
--
-- sha256 is the hex digest of the file contents; used for
-- deduplication, integrity checks, and re-upload detection.
--
-- storage_path is globally unique; prevents two rows pointing
-- at the same R2 object (which would orphan the object on
-- cascade delete of one row).
--
-- duration_ms is BIGINT to avoid floating point.
-- file_size_bytes is BIGINT — lossless audio routinely exceeds
-- the 32-bit int ceiling (~2.1 GB).
--
-- metadata_verified_at is the hybrid-extraction marker. The
-- client extracts duration and sha256 in the browser and writes
-- the row immediately (column is NULL). A Phase 2 worker
-- re-derives both server-side from the R2 object and sets the
-- column when verified. Column added now to avoid a migration
-- on a large table later.
-- ============================================================

CREATE TABLE audio_file (
  id                   UUID             PRIMARY KEY DEFAULT gen_random_uuid(),
  track_id             UUID             NOT NULL,
  storage_path         TEXT             NOT NULL,
  filename             TEXT             NOT NULL,
  mime_type            audio_mime_type  NOT NULL,
  duration_ms          BIGINT           NOT NULL,
  file_size_bytes      BIGINT           NOT NULL,
  sha256               TEXT             NOT NULL,
  metadata_verified_at TIMESTAMPTZ,
  uploaded_at          TIMESTAMPTZ      NOT NULL DEFAULT NOW(),

  CONSTRAINT audio_file_storage_path_uq    UNIQUE (storage_path),
  CONSTRAINT audio_file_track_mime_uq      UNIQUE (track_id, mime_type),

  CONSTRAINT audio_file_duration_ck        CHECK (duration_ms > 0),
  CONSTRAINT audio_file_size_ck            CHECK (file_size_bytes > 0),
  CONSTRAINT audio_file_sha256_format_ck   CHECK (sha256 ~ '^[a-f0-9]{64}$'),
  CONSTRAINT audio_file_filename_length_ck CHECK (length(filename) BETWEEN 1 AND 255),

  CONSTRAINT audio_file_track_id_fk
    FOREIGN KEY (track_id) REFERENCES track(id) ON DELETE CASCADE
);

CREATE INDEX audio_file_track_id_idx ON audio_file (track_id);
CREATE INDEX audio_file_sha256_idx   ON audio_file (sha256);


-- ============================================================
-- COMMENT THREAD
-- A version may have one public thread and one thread per
-- collective. Enforced by partial unique indexes below.
--
-- The app enforces that the collective in question actually
-- has access to the version's song (DB cannot enforce this
-- without subquery in CHECK, which Postgres disallows).
-- ============================================================

CREATE TABLE comment_thread (
  id            UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
  version_id    UUID           NOT NULL,
  scope         comment_scope  NOT NULL,
  collective_id UUID,
  created_at    TIMESTAMPTZ    NOT NULL DEFAULT NOW(),

  CONSTRAINT comment_thread_scope_collective_ck CHECK (
    (scope = 'collective' AND collective_id IS NOT NULL)
    OR
    (scope = 'public'     AND collective_id IS NULL)
  ),

  CONSTRAINT comment_thread_version_id_fk
    FOREIGN KEY (version_id) REFERENCES version(id) ON DELETE CASCADE,
  CONSTRAINT comment_thread_collective_id_fk
    FOREIGN KEY (collective_id) REFERENCES collective(id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX comment_thread_version_public_uq
  ON comment_thread (version_id)
  WHERE scope = 'public';

CREATE UNIQUE INDEX comment_thread_version_collective_uq
  ON comment_thread (version_id, collective_id)
  WHERE scope = 'collective';

CREATE INDEX comment_thread_version_id_idx
  ON comment_thread (version_id);


-- ============================================================
-- COMMENT
-- edited_at is NULL until the first edit.
-- deleted_at is the soft-delete marker; on soft-delete the app
-- replaces body with a placeholder ('[deleted]') and preserves
-- the row to keep conversation context intact.
--
-- audio_timestamp_ms is reserved for Phase 2 (timestamped
-- comments tied to a moment in the audio). Nullable for all
-- current/regular comments. Pre-added now to avoid a migration
-- on a potentially large table later.
-- ============================================================

CREATE TABLE comment (
  id                 UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id          UUID         NOT NULL,
  author_id          UUID         NOT NULL,
  body               TEXT         NOT NULL,
  audio_timestamp_ms BIGINT,
  edited_at          TIMESTAMPTZ,
  deleted_at         TIMESTAMPTZ,
  created_at         TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

  CONSTRAINT comment_body_length_ck     CHECK (length(body) BETWEEN 1 AND 10000),
  CONSTRAINT comment_audio_timestamp_ck CHECK (audio_timestamp_ms IS NULL OR audio_timestamp_ms >= 0),

  CONSTRAINT comment_thread_id_fk
    FOREIGN KEY (thread_id) REFERENCES comment_thread(id) ON DELETE CASCADE,
  CONSTRAINT comment_author_id_fk
    FOREIGN KEY (author_id) REFERENCES "user"(id)
);

CREATE INDEX comment_thread_id_idx ON comment (thread_id);
CREATE INDEX comment_author_id_idx ON comment (author_id);