-- Persist user-owned APEX agent conversations and ordered messages.
CREATE TABLE agent_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  skill_slug TEXT NOT NULL,
  title TEXT NOT NULL DEFAULT 'New conversation',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT agent_conversations_title_length CHECK (char_length(title) BETWEEN 1 AND 100)
);

CREATE INDEX agent_conversations_user_updated_idx
  ON agent_conversations(user_id, updated_at DESC);

CREATE TABLE agent_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES agent_conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT agent_messages_role_check CHECK (role IN ('user', 'assistant')),
  CONSTRAINT agent_messages_content_length CHECK (char_length(content) BETWEEN 1 AND 12000)
);

CREATE INDEX agent_messages_conversation_created_idx
  ON agent_messages(conversation_id, created_at ASC);
