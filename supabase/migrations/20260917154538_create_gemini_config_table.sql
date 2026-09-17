/*
# Create app_config table for storing server-side secrets

1. New Tables
- `app_config` — a key-value store for configuration that edge functions need access to
- `key` (text, primary key) — config key name
- `value` (text, not null) — the config value (e.g., API keys)
- `created_at` (timestamptz) — when the row was inserted
2. Security
- Enable RLS on `app_config`.
- Deny all access to `anon` and `authenticated` roles — this table is ONLY for server-side (service role / edge function) access.
- The service role bypasses RLS, so edge functions using the service role key can read freely.
- No SELECT/INSERT/UPDATE/DELETE policies are created for anon or authenticated.
*/

CREATE TABLE IF NOT EXISTS app_config (
  key text PRIMARY KEY,
  value text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE app_config ENABLE ROW LEVEL SECURITY;
