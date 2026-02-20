-- Add username column (nullable initially to backfill existing rows)
ALTER TABLE users ADD COLUMN IF NOT EXISTS username VARCHAR(30);

-- Backfill existing users: slugify name + 6-char ID prefix
UPDATE users
SET username = lower(regexp_replace(name, '[^a-zA-Z0-9]', '_', 'g')) || '_' || substring(id::text, 1, 6)
WHERE username IS NULL;

-- Enforce NOT NULL + uniqueness
ALTER TABLE users ALTER COLUMN username SET NOT NULL;
ALTER TABLE users ADD CONSTRAINT users_username_unique UNIQUE (username);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

-- Trigger to auto-update friendships.updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER friendships_updated_at
  BEFORE UPDATE ON friendships
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
