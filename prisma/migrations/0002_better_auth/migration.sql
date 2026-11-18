-- Better Auth schema migration.
-- Existing opaque custom sessions are invalidated because their tokens cannot
-- be converted into Better Auth session tokens. User and career data is kept.

ALTER TABLE users
  ADD COLUMN email_verified BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN image TEXT;

UPDATE users SET display_name = '' WHERE display_name IS NULL;
ALTER TABLE users ALTER COLUMN display_name SET DEFAULT '';
ALTER TABLE users ALTER COLUMN display_name SET NOT NULL;

DELETE FROM sessions;
ALTER TABLE sessions DROP COLUMN token_hash;
ALTER TABLE sessions ADD COLUMN token TEXT NOT NULL DEFAULT gen_random_uuid()::text;
ALTER TABLE sessions ALTER COLUMN token DROP DEFAULT;
ALTER TABLE sessions ADD COLUMN ip_address TEXT;
ALTER TABLE sessions ADD COLUMN user_agent TEXT;
ALTER TABLE sessions ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT now();
CREATE UNIQUE INDEX sessions_token_key ON sessions(token);

CREATE TABLE accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id TEXT NOT NULL,
  provider_id TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  access_token TEXT,
  refresh_token TEXT,
  id_token TEXT,
  access_token_expires_at TIMESTAMPTZ,
  refresh_token_expires_at TIMESTAMPTZ,
  scope TEXT,
  password TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT accounts_provider_account_unique UNIQUE(provider_id, account_id)
);
CREATE INDEX accounts_user_id_idx ON accounts(user_id);

CREATE TABLE verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier TEXT NOT NULL,
  value TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX verifications_identifier_idx ON verifications(identifier);

COMMENT ON TABLE accounts IS 'Better Auth linked identity and password credential records.';
COMMENT ON TABLE verifications IS 'Short-lived Better Auth verification records.';
