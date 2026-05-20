-- Cashier presence: periodic client heartbeats update this column; admins derive Online / Active / Offline.
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS last_heartbeat_at TIMESTAMPTZ NULL;

COMMENT ON COLUMN public.users.last_heartbeat_at IS 'Timestamp of last dashboard heartbeat from this user (cashiers).';

CREATE INDEX IF NOT EXISTS idx_users_cashier_heartbeat
  ON public.users (level, last_heartbeat_at DESC)
  WHERE level = 2;
