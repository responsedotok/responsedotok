-- ============================================================
-- PRESS KIT
-- A band's pitch to a specific recipient (label / individual),
-- reachable only via an unguessable token.
-- ============================================================
CREATE TABLE press_kit (
  id             UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id       UUID         NOT NULL,
  token          TEXT         NOT NULL,
  artist_name    TEXT         NOT NULL,
  recipient_name TEXT         NOT NULL,
  recipient_org  TEXT,
  greeting       TEXT         NOT NULL,
  pitch          TEXT         NOT NULL,
  revoked_at     TIMESTAMPTZ,
  created_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

  CONSTRAINT press_kit_token_uq             UNIQUE (token),
  CONSTRAINT press_kit_token_format_ck      CHECK (token ~ '^[A-Za-z0-9_-]{16,64}$'),
  CONSTRAINT press_kit_artist_len_ck        CHECK (length(artist_name) BETWEEN 1 AND 100),
  CONSTRAINT press_kit_recipient_len_ck     CHECK (length(recipient_name) BETWEEN 1 AND 100),
  CONSTRAINT press_kit_recipient_org_len_ck CHECK (recipient_org IS NULL OR length(recipient_org) <= 100),
  CONSTRAINT press_kit_greeting_len_ck      CHECK (length(greeting) BETWEEN 1 AND 200),
  CONSTRAINT press_kit_pitch_len_ck         CHECK (length(pitch) BETWEEN 1 AND 2000),

  CONSTRAINT press_kit_owner_id_fk
    FOREIGN KEY (owner_id) REFERENCES "user"(id) ON DELETE CASCADE
);

CREATE TRIGGER press_kit_set_updated_at
  BEFORE UPDATE ON press_kit
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX press_kit_owner_idx ON press_kit (owner_id, created_at DESC);


-- ============================================================
-- PRESS KIT TRACK
-- 1–2 songs per kit, stored in Vercel Blob. The (kit_id, position)
-- uniqueness plus the position CHECK caps a kit at two tracks.
-- ============================================================
CREATE TABLE press_kit_track (
  id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  kit_id      UUID         NOT NULL,
  blob_url    TEXT         NOT NULL,
  filename    TEXT         NOT NULL,
  mime_type   TEXT         NOT NULL,
  size_bytes  BIGINT       NOT NULL,
  position    SMALLINT     NOT NULL,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

  CONSTRAINT press_kit_track_position_ck CHECK (position IN (1, 2)),
  CONSTRAINT press_kit_track_size_ck     CHECK (size_bytes > 0),
  CONSTRAINT press_kit_track_filename_ck CHECK (length(filename) BETWEEN 1 AND 255),
  CONSTRAINT press_kit_track_kit_pos_uq  UNIQUE (kit_id, position),

  CONSTRAINT press_kit_track_kit_id_fk
    FOREIGN KEY (kit_id) REFERENCES press_kit(id) ON DELETE CASCADE
);

CREATE INDEX press_kit_track_kit_idx ON press_kit_track (kit_id, position);


-- ============================================================
-- PRESS KIT VIEW
-- One row per open of a kit link — the foundation for click tracking.
-- ============================================================
CREATE TABLE press_kit_view (
  id         UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  kit_id     UUID         NOT NULL,
  viewed_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  ip_hash    TEXT,
  user_agent TEXT,
  referrer   TEXT,

  CONSTRAINT press_kit_view_kit_id_fk
    FOREIGN KEY (kit_id) REFERENCES press_kit(id) ON DELETE CASCADE
);

CREATE INDEX press_kit_view_kit_idx ON press_kit_view (kit_id, viewed_at DESC);
