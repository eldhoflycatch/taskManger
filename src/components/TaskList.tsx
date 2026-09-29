import type { Task, WorkSession } from "../types";
import { formatDuration, sessionDurationMs } from "../lib/time";

type TaskListProps = {
  tasks: Task[];
  sessions: WorkSession[];
  activeSessionId: string | null;
  now: number;
  onStart: (taskId: string) => void;
  onStop: () => void;
  onDone: (taskId: string) => void;
};

function taskTimeMs(taskId: string, sessions: WorkSession[], now: number): number {
  return sessions
    .filter((session) => session.taskId === taskId)
    .reduce((sum, session) => sum + sessionDurationMs(session, now), 0);
}

export function TaskList({
  tasks,
  sessions,
  activeSessionId,
  now,
  onStart,
  onStop,
  onDone,
}: TaskListProps) {
  if (tasks.length === 0) {
    return (
      <p className="empty">
        No tasks yet. Add the first one above and start the clock when you begin.
      </p>
    );
  }

  return (
    <ul className="task-list">
      {tasks.map((task) => {
        const isActive = sessions.some(
          (session) =>
            session.id === activeSessionId && session.taskId === task.id,
        );
        const elapsed = taskTimeMs(task.id, sessions, now);

        return (
          <li
            key={task.id}
            className={`task-card${isActive ? " task-card--active" : ""}${
              task.status === "done" ? " task-card--done" : ""
            }`}
          >
            <div className="task-card__body">
              <p className="task-card__status">
                {task.status === "done"
                  ? "Done"
                  : isActive
                    ? "In progress"
                    : "To do"}
              </p>
              <h3>{task.title}</h3>
              {task.description ? <p className="task-card__desc">{task.description}</p> : null}
              <p className="task-card__time">{formatDuration(elapsed)}</p>
            </div>
            <div className="task-card__actions">
              {task.status !== "done" ? (
                isActive ? (
                  <button type="button" className="btn btn--danger" onClick={onStop}>
                    Stop
                  </button>
                ) : (
                  <button
                    type="button"
                    className="btn btn--primary"
                    onClick={() => onStart(task.id)}
                  >
                    Start
                  </button>
                )
              ) : null}
              {task.status !== "done" ? (
                <button
                  type="button"
                  className="btn btn--ghost"
                  onClick={() => onDone(task.id)}
                >
                  Mark done
                </button>
              ) : null}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
