import type { Task, WorkSession } from "../types";
import {
  formatClock,
  formatDuration,
  formatLongDate,
  sessionDurationMs,
} from "../lib/time";

type DailyReportProps = {
  tasks: Task[];
  sessions: WorkSession[];
  now: number;
};

function taskTotals(sessions: WorkSession[], now: number) {
  const map = new Map<string, { id: string; title: string; ms: number }>();
  for (const session of sessions) {
    const current = map.get(session.taskId) ?? {
      id: session.taskId,
      title: session.taskTitle,
      ms: 0,
    };
    current.ms += sessionDurationMs(session, now);
    map.set(session.taskId, current);
  }
  return [...map.values()].sort((a, b) => b.ms - a.ms);
}

export function DailyReport({ tasks, sessions, now }: DailyReportProps) {
  const totalMs = sessions.reduce(
    (sum, session) => sum + sessionDurationMs(session, now),
    0,
  );
  const perTask = taskTotals(sessions, now);
  const sortedSessions = [...sessions].sort(
    (a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime(),
  );

  return (
    <section className="report">
      <header className="report__header">
        <p className="eyebrow">End of day</p>
        <h2>Work log — {formatLongDate()}</h2>
        <p className="report__lede">
          Full session history for today, including start and end times, duration,
          and notes.
        </p>
        <button type="button" className="btn btn--ghost no-print" onClick={() => window.print()}>
          Print / save as PDF
        </button>
      </header>

      <div className="report__stats">
        <article>
          <p className="report__stat-label">Total time</p>
          <p className="report__stat-value">{formatDuration(totalMs)}</p>
        </article>
        <article>
          <p className="report__stat-label">Tasks</p>
          <p className="report__stat-value">{tasks.length}</p>
        </article>
        <article>
          <p className="report__stat-label">Sessions</p>
          <p className="report__stat-value">{sessions.length}</p>
        </article>
      </div>

      {perTask.length > 0 ? (
        <section className="report__block">
          <h3>Time by task</h3>
          <ul className="report__by-task">
            {perTask.map((item) => (
              <li key={item.id}>
                <span>{item.title}</span>
                <strong>{formatDuration(item.ms)}</strong>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="report__block">
        <h3>Session log</h3>
        {sortedSessions.length === 0 ? (
          <p className="empty">No work sessions yet today.</p>
        ) : (
          <div className="report__table-wrap">
            <table className="report__table">
              <thead>
                <tr>
                  <th>Task</th>
                  <th>Start</th>
                  <th>End</th>
                  <th>Duration</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {sortedSessions.map((session) => (
                  <tr key={session.id}>
                    <td>{session.taskTitle}</td>
                    <td>{formatClock(session.startAt)}</td>
                    <td>{session.endAt ? formatClock(session.endAt) : "Running"}</td>
                    <td>{formatDuration(sessionDurationMs(session, now))}</td>
                    <td>{session.note || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </section>
  );
}
