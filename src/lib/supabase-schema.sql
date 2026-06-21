-- User profiles (display names, avatars, daily streaks)
CREATE TABLE IF NOT EXISTS user_profiles (
  wallet_address TEXT PRIMARY KEY,
  display_name TEXT,
  avatar_emoji TEXT DEFAULT '👤',
  streak_count INTEGER DEFAULT 0,
  last_checkin DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reminder tracking (for auto-debit logic)
CREATE TABLE IF NOT EXISTS reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id TEXT REFERENCES groups(id) ON DELETE CASCADE,
  from_address TEXT NOT NULL,
  to_address TEXT NOT NULL,
  amount DECIMAL(18,6) NOT NULL,
  sent_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS groups (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  emoji TEXT DEFAULT 'Users',
  description TEXT,
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  onchain_tx TEXT
);

CREATE TABLE IF NOT EXISTS group_members (
  group_id TEXT REFERENCES groups(id) ON DELETE CASCADE,
  wallet_address TEXT NOT NULL,
  display_name TEXT,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  onchain_tx TEXT,
  PRIMARY KEY (group_id, wallet_address)
);

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_address TEXT NOT NULL,
  group_id TEXT REFERENCES groups(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  actor TEXT,
  action_url TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id TEXT REFERENCES groups(id) ON DELETE CASCADE,
  sender TEXT NOT NULL,
  text TEXT,
  attachment_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id TEXT REFERENCES groups(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  category TEXT DEFAULT 'other',
  total_amount DECIMAL(18,6) NOT NULL,
  paid_by TEXT NOT NULL,
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  onchain_tx TEXT
);

CREATE TABLE IF NOT EXISTS expense_splits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_id UUID REFERENCES expenses(id) ON DELETE CASCADE,
  wallet_address TEXT NOT NULL,
  amount DECIMAL(18,6) NOT NULL,
  is_payer BOOLEAN DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS settlements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id TEXT NOT NULL,
  debtor TEXT NOT NULL,
  creditor TEXT NOT NULL,
  amount DECIMAL(18,6) NOT NULL,
  onchain_tx TEXT NOT NULL,
  settled_at TIMESTAMPTZ DEFAULT NOW()
);

-- Recurring expense rules and generated drafts
CREATE TABLE IF NOT EXISTS recurring_expense_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id TEXT REFERENCES groups(id) ON DELETE CASCADE,
  created_by TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT DEFAULT 'other',
  amount DECIMAL(18,6) NOT NULL,
  payer_address TEXT NOT NULL,
  participant_addresses TEXT[] NOT NULL,
  cadence TEXT NOT NULL CHECK (cadence IN ('weekly', 'monthly')),
  day_of_week INTEGER CHECK (day_of_week BETWEEN 0 AND 6),
  day_of_month INTEGER CHECK (day_of_month BETWEEN 1 AND 31),
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS recurring_expense_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_id UUID REFERENCES recurring_expense_rules(id) ON DELETE CASCADE,
  group_id TEXT REFERENCES groups(id) ON DELETE CASCADE,
  due_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processed', 'skipped')),
  processed_expense_id UUID REFERENCES expenses(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ
);

-- Expense revisions and reversals
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active';
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS reversed_at TIMESTAMPTZ;
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS reversed_by TEXT;
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS reversed_reason TEXT;

CREATE TABLE IF NOT EXISTS expense_revisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_id UUID REFERENCES expenses(id) ON DELETE CASCADE,
  group_id TEXT REFERENCES groups(id) ON DELETE CASCADE,
  actor TEXT NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('edit', 'reverse')),
  before_snapshot JSONB NOT NULL,
  after_snapshot JSONB NOT NULL,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Settlement batching
CREATE TABLE IF NOT EXISTS settlement_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id TEXT REFERENCES groups(id) ON DELETE CASCADE,
  debtor TEXT NOT NULL,
  total_amount DECIMAL(18,6) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'processing' CHECK (status IN ('processing', 'completed', 'failed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS settlement_batch_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id UUID REFERENCES settlement_batches(id) ON DELETE CASCADE,
  creditor TEXT NOT NULL,
  amount DECIMAL(18,6) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'success', 'failed')),
  tx_hash TEXT,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notification preferences and quiet hours
CREATE TABLE IF NOT EXISTS notification_preferences (
  wallet_address TEXT PRIMARY KEY,
  allow_reminders BOOLEAN DEFAULT TRUE,
  allow_expense_updates BOOLEAN DEFAULT TRUE,
  allow_group_updates BOOLEAN DEFAULT TRUE,
  allow_messages BOOLEAN DEFAULT TRUE,
  allow_settlements BOOLEAN DEFAULT TRUE,
  quiet_hours_enabled BOOLEAN DEFAULT FALSE,
  quiet_hours_start TEXT DEFAULT '22:00',
  quiet_hours_end TEXT DEFAULT '07:00',
  timezone TEXT DEFAULT 'UTC',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User address book aliases
CREATE TABLE IF NOT EXISTS address_book (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_address TEXT NOT NULL,
  contact_address TEXT NOT NULL,
  nickname TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(owner_address, contact_address)
);

CREATE INDEX IF NOT EXISTS idx_recurring_rules_group ON recurring_expense_rules(group_id);
CREATE INDEX IF NOT EXISTS idx_recurring_runs_group_status ON recurring_expense_runs(group_id, status);
CREATE INDEX IF NOT EXISTS idx_expense_revisions_group ON expense_revisions(group_id);
CREATE INDEX IF NOT EXISTS idx_batches_group_debtor ON settlement_batches(group_id, debtor);
CREATE INDEX IF NOT EXISTS idx_batch_items_batch_status ON settlement_batch_items(batch_id, status);
CREATE INDEX IF NOT EXISTS idx_address_book_owner ON address_book(owner_address);
CREATE INDEX IF NOT EXISTS idx_expenses_group_status ON expenses(group_id, status);

ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_splits ENABLE ROW LEVEL SECURITY;
ALTER TABLE settlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE recurring_expense_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE recurring_expense_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_revisions ENABLE ROW LEVEL SECURITY;
ALTER TABLE settlement_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE settlement_batch_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE address_book ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all" ON groups;
CREATE POLICY "Allow all" ON groups FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow all" ON group_members;
CREATE POLICY "Allow all" ON group_members FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow all" ON expenses;
CREATE POLICY "Allow all" ON expenses FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow all" ON expense_splits;
CREATE POLICY "Allow all" ON expense_splits FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow all" ON settlements;
CREATE POLICY "Allow all" ON settlements FOR ALL USING (true);

-- Notifications: anon may read / mark-read / delete, but NOT insert. Inserts go
-- through the /api/notifications server route (service-role key) so the public
-- anon key can no longer forge notifications for arbitrary users.
-- NOTE: apply this only after SUPABASE_SERVICE_ROLE_KEY is set in the deployment,
-- otherwise notification creation will start failing.
DROP POLICY IF EXISTS "Allow all" ON notifications;
DROP POLICY IF EXISTS "notifications_select" ON notifications;
DROP POLICY IF EXISTS "notifications_update" ON notifications;
DROP POLICY IF EXISTS "notifications_delete" ON notifications;
CREATE POLICY "notifications_select" ON notifications FOR SELECT USING (true);
CREATE POLICY "notifications_update" ON notifications FOR UPDATE USING (true);
CREATE POLICY "notifications_delete" ON notifications FOR DELETE USING (true);
-- (no INSERT policy => anon INSERT is denied; the service role bypasses RLS)

-- Messages: server-only. All reads/writes go through /api/messages (service
-- role, session-authenticated), so the anon key gets no access at all.
-- Apply only after AUTH_SECRET + SUPABASE_SERVICE_ROLE_KEY are configured.
DROP POLICY IF EXISTS "Allow all" ON messages;
-- (no anon policies => anon denied; the service role bypasses RLS)

DROP POLICY IF EXISTS "Allow all" ON recurring_expense_rules;
CREATE POLICY "Allow all" ON recurring_expense_rules FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow all" ON recurring_expense_runs;
CREATE POLICY "Allow all" ON recurring_expense_runs FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow all" ON expense_revisions;
CREATE POLICY "Allow all" ON expense_revisions FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow all" ON settlement_batches;
CREATE POLICY "Allow all" ON settlement_batches FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow all" ON settlement_batch_items;
CREATE POLICY "Allow all" ON settlement_batch_items FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow all" ON notification_preferences;
CREATE POLICY "Allow all" ON notification_preferences FOR ALL USING (true);

-- Address book: server-only, strictly owner-scoped via /api/address-book
-- (service role, session-authenticated). Anon key gets no access.
-- Apply only after AUTH_SECRET + SUPABASE_SERVICE_ROLE_KEY are configured.
DROP POLICY IF EXISTS "Allow all" ON address_book;
-- (no anon policies => anon denied; the service role bypasses RLS)

-- Off-chain visibility for savings circles (the SavingsCircle contract has no
-- privacy concept). is_public = true means the circle shows in the public
-- Explore directory to everyone, including disconnected guests. Private circles
-- are hidden from the directory and reached only via direct link / membership.
CREATE TABLE IF NOT EXISTS circle_settings (
  circle_id TEXT PRIMARY KEY,
  is_public BOOLEAN DEFAULT TRUE,
  creator TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE circle_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all" ON circle_settings;
CREATE POLICY "Allow all" ON circle_settings FOR ALL USING (true);
