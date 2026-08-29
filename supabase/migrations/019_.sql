ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS upi_id text DEFAULT '',
  ADD COLUMN IF NOT EXISTS invoice_theme text DEFAULT 'indigo';  