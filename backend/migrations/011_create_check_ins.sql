CREATE TABLE IF NOT EXISTS check_ins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  location_id UUID NOT NULL REFERENCES locations(id) ON DELETE CASCADE,
  checked_in_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Unique index to enforce one check-in per user per location per calendar day
CREATE UNIQUE INDEX idx_check_ins_user_location_date 
ON check_ins (user_id, location_id, ((checked_in_at AT TIME ZONE 'UTC')::date));

-- Index for counting check-ins per location for a user
CREATE INDEX idx_check_ins_user_location 
ON check_ins (user_id, location_id);

-- Index for user stats
CREATE INDEX idx_check_ins_user 
ON check_ins (user_id);
