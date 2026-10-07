export type Role = "lead" | "member";

export type UserRow = {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  created_at: string;
};

export type MembershipRow = {
  user_id: string;
  team_id: string;
  role: Role;
};

export type TeamRow = {
  id: string;
  name: string;
  invite_code: string;
  created_at: string;
};

export type TaskRow = {
  id: string;
  user_id: string;
  team_id: string;
  title: string;
  description: string | null;
  created_at: string;
  day_key: string;
  status: "todo" | "in_progress" | "done";
};

export type SessionRow = {
  id: string;
  user_id: string;
  team_id: string;
  task_id: string;
  task_title: string;
  start_at: string;
  end_at: string | null;
  note: string;
  day_key: string;
};

export type PublicUser = {
  id: string;
  name: string;
  email: string;
};

export type PublicTask = {
  id: string;
  title: string;
  description?: string;
  createdAt: string;
  dayKey: string;
  status: "todo" | "in_progress" | "done";
};

export type PublicSession = {
  id: string;
  taskId: string;
  taskTitle: string;
  startAt: string;
  endAt: string | null;
  note: string;
};

export type TeamSummary = {
  id: string;
  name: string;
  role: Role;
  inviteCode?: string;
};

export type MeResponse = {
  user: PublicUser;
  team: TeamSummary | null;
};

export type MemberDay = {
  id: string;
  name: string;
  tasks: PublicTask[];
  sessions: PublicSession[];
  completedTasks: PublicTask[];
  totals: {
    totalMs: number;
    taskCount: number;
    sessionCount: number;
  };
};

export type TeamDayPayload = {
  dayKey: string;
  teamId: string;
  teamName: string;
  members: MemberDay[];
};
