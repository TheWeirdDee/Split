CREATE TABLE groups (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  emoji TEXT DEFAULT 'Users',
  description TEXT,
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  onchain_tx TEXT
);

CREATE TABLE group_members (
  group_id TEXT REFERENCES groups(id) ON DELETE CASCADE,
  wallet_address TEXT NOT NULL,
  display_name TEXT,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  onchain_tx TEXT,
  PRIMARY KEY (group_id, wallet_address)
);

CREATE TABLE notifications (
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

CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id TEXT REFERENCES groups(id) ON DELETE CASCADE,
  sender TEXT NOT NULL,
  text TEXT,
  attachment_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE expenses (
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

CREATE TABLE expense_splits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  expense_id UUID REFERENCES expenses(id) ON DELETE CASCADE,
  wallet_address TEXT NOT NULL,
  amount DECIMAL(18,6) NOT NULL,
  is_payer BOOLEAN DEFAULT FALSE
);

CREATE TABLE settlements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id TEXT NOT NULL,
  debtor TEXT NOT NULL,
  creditor TEXT NOT NULL,
  amount DECIMAL(18,6) NOT NULL,
  onchain_tx TEXT NOT NULL,
  settled_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_splits ENABLE ROW LEVEL SECURITY;
ALTER TABLE settlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all" ON groups FOR ALL USING (true);
CREATE POLICY "Allow all" ON group_members FOR ALL USING (true);
CREATE POLICY "Allow all" ON expenses FOR ALL USING (true);
CREATE POLICY "Allow all" ON expense_splits FOR ALL USING (true);
CREATE POLICY "Allow all" ON settlements FOR ALL USING (true);
CREATE POLICY "Allow all" ON notifications FOR ALL USING (true);
CREATE POLICY "Allow all" ON messages FOR ALL USING (true);