# APEX Persistent Agent Conversations

The Agent Workbench now stores user-owned conversations and uses recent turns as model context.

## Database

Migration `0004_agent_conversations` creates:
- `agent_conversations`: owner, selected skill, title and timestamps.
- `agent_messages`: ordered user/assistant messages.

Deleting a user cascades to conversations; deleting a conversation cascades to its messages. A database check restricts message roles to `user` and `assistant`, and caps individual message content at 12,000 characters. Conversations are capped at 100 messages by the API.

Apply the migration after generating the Prisma client:

```bash
npm run db:generate
npm run db:migrate
```

## API

All endpoints require a Better Auth session and derive ownership from the authenticated user.

- `GET /api/agent/conversations?limit=20` — list the current user's latest conversations (maximum 50).
- `POST /api/agent/conversations` — create a conversation with `{"skill":"interview-prep"}`.
- `GET /api/agent/conversations/:id` — retrieve an owned conversation and its messages.
- `DELETE /api/agent/conversations/:id` — delete an owned conversation and all messages.
- `POST /api/agent/conversations/:id/messages` — save a learner message, request a model response using conversation context, and save the assistant response.

The deprecated `POST /api/agent/respond` endpoint returns HTTP 410 and points to the conversation API.

## Context policy

- Each request includes the selected skill instructions and at most the latest 12 prior messages plus the current learner message.
- The skill is fixed when the conversation is created. Start a new conversation to change skills.
- No cross-conversation profile memory is created.
- No semantic memory extraction, vector database, or background summarisation is used.
- The API returns at most 100 messages when loading a conversation.
- A conversation can contain at most 100 messages; start a new conversation after reaching the cap.

## Privacy and deletion

Conversation records are scoped by `userId` on every read, write and delete. The database cascades message deletion with the parent conversation. Users can delete each conversation in the Workbench. There is no global memory or cross-chat personalisation feature in this milestone.

Messages are sent to the server-configured AI provider to generate responses. The provider's data handling and retention terms also apply. Do not submit passwords, API keys, or sensitive personal information. This application does not currently provide bulk export, automatic expiry, or a configurable retention period.

## Known limitations

- Requires PostgreSQL and migration 0004.
- Requires server-side AI provider configuration.
- No per-user shared rate limiter, usage budget, pagination, streaming or cancellation.
- Concurrent sends in the same conversation are not serialised.
- A learner message is saved before the provider call; if generation fails, that user message remains and the API reports the failure.
- No tool execution, shell, browser, repository access or code execution.
