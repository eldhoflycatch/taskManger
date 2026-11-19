import { db } from "./db";
import { sessionDurationMs, todayKey } from "./time";
import type {
  MemberDay,
  MembershipRow,
  SessionRow,
  TaskRow,
  ManagedTeam,
  TeamDayPayload,
  TeamRow,
  UserRow,
} from "./types";
import { mapSession, mapTask } from "./util";

export function getUserByEmail(email: string): UserRow | undefined {
  return db.prepare("SELECT * FROM users WHERE email = ?").get(email) as
    | UserRow
    | undefined;
}

export function getUserById(id: string): UserRow | undefined {
  return db.prepare("SELECT * FROM users WHERE id = ?").get(id) as
    | UserRow
    | undefined;
}

export function getMembership(userId: string): MembershipRow | undefined {
  return db
    .prepare("SELECT * FROM memberships WHERE user_id = ?")
    .get(userId) as MembershipRow | undefined;
}

export function getTeam(teamId: string): TeamRow | undefined {
  return db.prepare("SELECT * FROM teams WHERE id = ?").get(teamId) as
    | TeamRow
    | undefined;
}

export function getTeamByInvite(code: string): TeamRow | undefined {
  return db
    .prepare("SELECT * FROM teams WHERE invite_code = ?")
    .get(code) as TeamRow | undefined;
}

export function listTeamMembers(teamId: string): { id: string; name: string }[] {
  return db
    .prepare(
      `SELECT u.id, u.name
       FROM memberships m
       JOIN users u ON u.id = m.user_id
       WHERE m.team_id = ?
       ORDER BY u.name COLLATE NOCASE`,
    )
    .all(teamId) as { id: string; name: string }[];
}

export function getOpenSession(userId: string): SessionRow | undefined {
  return db
    .prepare("SELECT * FROM sessions WHERE user_id = ? AND end_at IS NULL")
    .get(userId) as SessionRow | undefined;
}

export function getUserTasks(userId: string, day: string): TaskRow[] {
  return db
    .prepare(
      "SELECT * FROM tasks WHERE user_id = ? AND day_key = ? ORDER BY created_at",
    )
    .all(userId, day) as TaskRow[];
}

export function getUserSessions(userId: string, day: string): SessionRow[] {
  return db
    .prepare(
      "SELECT * FROM sessions WHERE user_id = ? AND day_key = ? ORDER BY start_at",
    )
    .all(userId, day) as SessionRow[];
}

export function getTask(taskId: string): TaskRow | undefined {
  return db.prepare("SELECT * FROM tasks WHERE id = ?").get(taskId) as
    | TaskRow
    | undefined;
}

export function getSession(sessionId: string): SessionRow | undefined {
  return db.prepare("SELECT * FROM sessions WHERE id = ?").get(sessionId) as
    | SessionRow
    | undefined;
}

export function buildMemberDay(
  member: { id: string; name: string },
  day: string,
  now: number = Date.now(),
): MemberDay {
  const tasks = getUserTasks(member.id, day).map(mapTask);
  const sessions = getUserSessions(member.id, day).map(mapSession);
  const totalMs = sessions.reduce(
    (sum, session) => sum + sessionDurationMs(session.startAt, session.endAt, now),
    0,
  );
  return {
    id: member.id,
    name: member.name,
    tasks,
    sessions,
    completedTasks: tasks.filter((task) => task.status === "done"),
    totals: {
      totalMs,
      taskCount: tasks.length,
      sessionCount: sessions.length,
    },
  };
}

export function buildTeamDay(team: TeamRow, day: string = todayKey()): TeamDayPayload {
  const now = Date.now();
  const members = listTeamMembers(team.id).map((member) =>
    buildMemberDay(member, day, now),
  );
  return {
    dayKey: day,
    teamId: team.id,
    teamName: team.name,
    members,
  };
}

export function listManagedTeams(managerId: string): ManagedTeam[] {
  const rows = db
    .prepare(
      `SELECT t.id, t.name, t.invite_code AS inviteCode,
              (SELECT COUNT(*) FROM memberships m WHERE m.team_id = t.id) AS memberCount
       FROM teams t WHERE t.manager_id = ?
       ORDER BY t.name COLLATE NOCASE`,
    )
    .all(managerId) as ManagedTeam[];
  return rows;
}

export function getManagedTeam(managerId: string, teamId: string): TeamRow | undefined {
  return db
    .prepare("SELECT * FROM teams WHERE id = ? AND manager_id = ?")
    .get(teamId, managerId) as TeamRow | undefined;
}

export type ExportRow = {
  day: string;
  team: string;
  member: string;
  task: string;
  description: string;
  status: "todo" | "in_progress" | "done";
  durationMs: number;
  notes: string;
};

/** One row per task for a date range, optionally limited to one member. */
export function buildRangeRows(
  team: TeamRow,
  from: string,
  to: string,
  memberId?: string,
): ExportRow[] {
  const now = Date.now();
  const tasks = db
    .prepare(
      `SELECT t.*, u.name AS member_name
       FROM tasks t JOIN users u ON u.id = t.user_id
       WHERE t.team_id = ? AND t.day_key BETWEEN ? AND ?
         AND (? IS NULL OR t.user_id = ?)
       ORDER BY t.day_key, u.name COLLATE NOCASE, t.created_at`,
    )
    .all(team.id, from, to, memberId ?? null, memberId ?? null) as (TaskRow & {
    member_name: string;
  })[];
  const sessionStmt = db.prepare(
    "SELECT * FROM sessions WHERE task_id = ? ORDER BY start_at",
  );
  return tasks.map((t) => {
    const sessions = sessionStmt.all(t.id) as SessionRow[];
    return {
      day: t.day_key,
      team: team.name,
      member: t.member_name,
      task: t.title,
      description: t.description ?? "",
      status: t.status,
      durationMs: sessions.reduce(
        (sum, s) => sum + sessionDurationMs(s.start_at, s.end_at, now),
        0,
      ),
      notes: sessions
        .map((s) => s.note.trim())
        .filter(Boolean)
        .join("; "),
    };
  });
}
