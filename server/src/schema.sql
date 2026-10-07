CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS teams (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  invite_code TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS memberships (
  user_id TEXT PRIMARY KEY,
  team_id TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('lead', 'member')),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (team_id) REFERENCES teams(id)
);

CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  team_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  created_at TEXT NOT NULL,
  day_key TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('todo', 'in_progress', 'done')),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (team_id) REFERENCES teams(id)
);

CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  team_id TEXT NOT NULL,
  task_id TEXT NOT NULL,
  task_title TEXT NOT NULL,
  start_at TEXT NOT NULL,
  end_at TEXT,
  note TEXT NOT NULL DEFAULT '',
  day_key TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (team_id) REFERENCES teams(id),
  FOREIGN KEY (task_id) REFERENCES tasks(id)
);

CREATE TABLE IF NOT EXISTS daily_reports (
  id TEXT PRIMARY KEY,
  team_id TEXT NOT NULL,
  day_key TEXT NOT NULL,
  saved_by TEXT NOT NULL,
  saved_at TEXT NOT NULL,
  payload TEXT NOT NULL,
  UNIQUE (team_id, day_key),
  FOREIGN KEY (team_id) REFERENCES teams(id),
  FOREIGN KEY (saved_by) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_tasks_user_day ON tasks(user_id, day_key);
CREATE INDEX IF NOT EXISTS idx_tasks_team_day ON tasks(team_id, day_key);
CREATE INDEX IF NOT EXISTS idx_sessions_user_day ON sessions(user_id, day_key);
CREATE INDEX IF NOT EXISTS idx_sessions_team_day ON sessions(team_id, day_key);
CREATE INDEX IF NOT EXISTS idx_sessions_open ON sessions(user_id, end_at);
CREATE INDEX IF NOT EXISTS idx_memberships_team ON memberships(team_id);
