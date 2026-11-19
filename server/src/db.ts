import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Database from "better-sqlite3";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, "../data");
fs.mkdirSync(dataDir, { recursive: true });

export const db = new Database(process.env.DAYLOG_DB || path.join(dataDir, "daylog.db"));
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

const schema = fs.readFileSync(path.join(__dirname, "schema.sql"), "utf8");
db.exec(schema);

// --- Migrations (idempotent) ---
function hasColumn(table: string, column: string): boolean {
  const cols = db.prepare(`PRAGMA table_info(${table})`).all() as { name: string }[];
  return cols.some((c) => c.name === column);
}

if (!hasColumn("users", "role")) {
  db.exec("ALTER TABLE users ADD COLUMN role TEXT NOT NULL DEFAULT 'member'");
}
if (!hasColumn("teams", "manager_id")) {
  db.exec("ALTER TABLE teams ADD COLUMN manager_id TEXT");
  // Former team leads become managers who own their team.
  db.exec(`
    UPDATE teams SET manager_id = (
      SELECT user_id FROM memberships WHERE team_id = teams.id AND role = 'lead' LIMIT 1
    );
    UPDATE users SET role = 'manager'
      WHERE id IN (SELECT manager_id FROM teams WHERE manager_id IS NOT NULL);
    DELETE FROM memberships WHERE role = 'lead';
  `);
}
db.exec("CREATE INDEX IF NOT EXISTS idx_teams_manager ON teams(manager_id)");
