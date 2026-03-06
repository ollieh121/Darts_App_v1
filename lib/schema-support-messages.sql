-- Optional: run in Neon if you already have the main schema (adds support messages + backup-friendly structure)
CREATE TABLE IF NOT EXISTS support_messages (
  id SERIAL PRIMARY KEY,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
