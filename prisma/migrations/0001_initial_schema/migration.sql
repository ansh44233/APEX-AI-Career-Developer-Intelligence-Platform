-- APEX initial PostgreSQL schema
-- Apply only after provisioning a PostgreSQL database and reviewing the migration.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  display_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE auth_identities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  provider_subject TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (provider, provider_subject),
  UNIQUE (user_id, provider)
);

-- Store only a cryptographic hash of each opaque session token.
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_seen_at TIMESTAMPTZ
);
CREATE INDEX sessions_user_id_idx ON sessions(user_id);
CREATE INDEX sessions_expires_at_idx ON sessions(expires_at);

CREATE TABLE career_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  target_role TEXT NOT NULL,
  target_company TEXT,
  target_date DATE,
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'paused', 'completed', 'archived')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX career_goals_user_status_idx ON career_goals(user_id, status);

CREATE TABLE practice_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  goal_id UUID REFERENCES career_goals(id) ON DELETE SET NULL,
  module TEXT NOT NULL
    CHECK (module IN ('interview', 'coding', 'system_design', 'resume', 'project_defense')),
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'in_progress'
    CHECK (status IN ('in_progress', 'completed', 'abandoned')),
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX practice_sessions_user_started_idx ON practice_sessions(user_id, started_at DESC);
CREATE INDEX practice_sessions_goal_idx ON practice_sessions(goal_id);

CREATE TABLE practice_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES practice_sessions(id) ON DELETE CASCADE,
  prompt TEXT NOT NULL,
  response_text TEXT,
  feedback_json JSONB,
  score NUMERIC(5,2) CHECK (score IS NULL OR (score >= 0 AND score <= 100)),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX practice_attempts_session_created_idx ON practice_attempts(session_id, created_at);

CREATE TABLE skill_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  goal_id UUID REFERENCES career_goals(id) ON DELETE SET NULL,
  skill_key TEXT NOT NULL,
  rating SMALLINT NOT NULL CHECK (rating BETWEEN 0 AND 4),
  evidence_note TEXT,
  assessed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX skill_assessments_user_skill_date_idx
  ON skill_assessments(user_id, skill_key, assessed_at DESC);

CREATE TABLE user_consents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  purpose TEXT NOT NULL,
  policy_version TEXT NOT NULL,
  granted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  withdrawn_at TIMESTAMPTZ,
  UNIQUE (user_id, purpose, policy_version)
);
CREATE INDEX user_consents_user_purpose_idx ON user_consents(user_id, purpose);

COMMENT ON TABLE practice_attempts IS 'User-submitted practice content; apply retention and deletion policies.';
COMMENT ON COLUMN sessions.token_hash IS 'Hash only; never persist the raw browser session token.';
