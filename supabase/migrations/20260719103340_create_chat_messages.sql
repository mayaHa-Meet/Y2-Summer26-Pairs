/*
# Create chat_messages table (single-tenant, no auth)

1. Purpose
   Stores the persisted chat history for the dual-agent chat app.
   Each row is one message exchanged between a user and one of the two AI agents
   (Tal the debugger, or Talia the coder). The frontend reads this table on load
   to restore prior conversations and appends a row for every new user prompt
   and every agent reply.

2. New Tables
   - `chat_messages`
     - `id`            (uuid, primary key, auto-generated)
     - `agent`         (text, not null) — which agent the message belongs to.
                       Values: 'tal' (debugger) or 'talia' (coder).
     - `role`          (text, not null) — 'user' for prompts, 'assistant' for replies.
     - `content`       (text, not null) — the message text.
     - `created_at`    (timestamptz, default now()) — ordering + display timestamp.

3. Indexes
   - Composite index on (agent, created_at) so each agent's conversation loads
     in chronological order efficiently.

4. Security
   - Enable RLS on `chat_messages`.
   - This is a single-tenant demo app with no sign-in screen, so the anon-key
     frontend must be able to read and write its own shared chat history.
     All four CRUD policies are scoped `TO anon, authenticated` with `USING (true)`
     / `WITH CHECK (true)` because the data is intentionally shared/public.

5. Notes
   - No `user_id` column and no foreign keys to `auth.users` — there is no auth.
   - Idempotent: uses `IF NOT EXISTS` for the table and drops policies before
     recreating them so the migration is safe to re-run.
*/

CREATE TABLE IF NOT EXISTS chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent text NOT NULL,
  role text NOT NULL CHECK (role IN ('user', 'assistant')),
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_agent_created_at
  ON chat_messages (agent, created_at);

ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_chat_messages" ON chat_messages;
CREATE POLICY "anon_select_chat_messages" ON chat_messages
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_chat_messages" ON chat_messages;
CREATE POLICY "anon_insert_chat_messages" ON chat_messages
  FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_chat_messages" ON chat_messages;
CREATE POLICY "anon_update_chat_messages" ON chat_messages
  FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_chat_messages" ON chat_messages;
CREATE POLICY "anon_delete_chat_messages" ON chat_messages
  FOR DELETE TO anon, authenticated USING (true);
