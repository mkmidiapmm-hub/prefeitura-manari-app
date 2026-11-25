-- Total compartilhado desde a ativação; identificadores anônimos duram no máximo 24h.
CREATE TABLE IF NOT EXISTS visit_totals (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  total INTEGER NOT NULL DEFAULT 0 CHECK (total >= 0),
  started_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%SZ', 'now'))
);
INSERT OR IGNORE INTO visit_totals (id, total) VALUES (1, 0);
CREATE TABLE IF NOT EXISTS visit_sessions (
  id TEXT PRIMARY KEY,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);
CREATE INDEX IF NOT EXISTS visit_sessions_created_at ON visit_sessions(created_at);
CREATE TRIGGER IF NOT EXISTS visit_sessions_increment AFTER INSERT ON visit_sessions
BEGIN
  UPDATE visit_totals SET total = total + 1 WHERE id = 1;
END;
