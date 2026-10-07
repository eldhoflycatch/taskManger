export type TaskStatus = "todo" | "in_progress" | "done";

export type Task = {
  id: string;
  title: string;
  description?: string;
  createdAt: string;
  dayKey: string;
  status: TaskStatus;
};

export type WorkSession = {
  id: string;
  taskId: string;
  taskTitle: string;
  startAt: string;
  endAt: string | null;
  note: string;
};

export type User = {
  id: string;
  name: string;
  email: string;
};

export type Team = {
  id: string;
  name: string;
  role: "lead" | "member";
  inviteCode?: string;
};

export type Me = {
  user: User;
  team: Team | null;
};

export type WorkPayload = {
  tasks: Task[];
  sessions: WorkSession[];
  activeSessionId: string | null;
};

export type LiveMember = {
  id: string;
  name: string;
  currentSession: WorkSession | null;
};

export type MemberDay = {
  id: string;
  name: string;
  tasks: Task[];
  sessions: WorkSession[];
  completedTasks: Task[];
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

export type SavedReportListItem = {
  id: string;
  dayKey: string;
  savedAt: string;
  savedBy: string;
};

export type SavedReport = SavedReportListItem & {
  payload: TeamDayPayload;
};
