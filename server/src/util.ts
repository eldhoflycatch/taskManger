import type {
  MembershipRow,
  PublicSession,
  PublicTask,
  PublicUser,
  SessionRow,
  TaskRow,
  TeamRow,
  TeamSummary,
  UserRow,
} from "./types";

export function createId(): string {
  return crypto.randomUUID();
}

export function inviteCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

export function publicUser(user: UserRow): PublicUser {
  return { id: user.id, name: user.name, email: user.email };
}

export function mapTask(row: TaskRow): PublicTask {
  return {
    id: row.id,
    title: row.title,
    description: row.description || undefined,
    createdAt: row.created_at,
    dayKey: row.day_key,
    status: row.status,
  };
}

export function mapSession(row: SessionRow): PublicSession {
  return {
    id: row.id,
    taskId: row.task_id,
    taskTitle: row.task_title,
    startAt: row.start_at,
    endAt: row.end_at,
    note: row.note,
  };
}

export function teamSummary(
  team: TeamRow,
  membership: MembershipRow,
): TeamSummary {
  return {
    id: team.id,
    name: team.name,
    role: membership.role,
    inviteCode: membership.role === "lead" ? team.invite_code : undefined,
  };
}

export class HttpError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}
