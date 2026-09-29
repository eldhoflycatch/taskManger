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

export type Store = {
  tasks: Task[];
  sessions: WorkSession[];
  activeSessionId: string | null;
};
