-- Run this SQL in your Neon/Vercel Postgres database to create the tables
-- (Vercel Dashboard > Storage > your Postgres > Query)

CREATE TABLE IF NOT EXISTS game_state (
  id TEXT PRIMARY KEY DEFAULT 'default',
  started_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS teams (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  remaining_points INTEGER NOT NULL DEFAULT 100000,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS scores (
  id SERIAL PRIMARY KEY,
  team_id TEXT NOT NULL REFERENCES teams(id),
  score INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default game state and teams
INSERT INTO game_state (id, started_at) 
VALUES ('default', NULL) 
ON CONFLICT (id) DO NOTHING;

INSERT INTO teams (id, name, remaining_points) VALUES 
  ('team1', 'Team 1', 100000),
  ('team2', 'Team 2', 100000)
ON CONFLICT (id) DO NOTHING;
