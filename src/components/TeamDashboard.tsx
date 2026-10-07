import { useCallback, useEffect, useState } from "react";
import { api } from "../api";
import { formatClock, formatDuration, formatLongDate } from "../lib/time";
import type { LiveMember, SavedReport, SavedReportListItem, TeamDayPayload } from "../types";
import { DailyReport } from "./DailyReport";

function parseDay(dayKey: string): Date {
  const [year, month, day] = dayKey.split("-").map(Number);
  return new Date(year, (month ?? 1) - 1, day ?? 1);
}

export function TeamDashboard() {
  const [live, setLive] = useState<LiveMember[]>([]);
  const [today, setToday] = useState<TeamDayPayload | null>(null);
  const [saved, setSaved] = useState<SavedReportListItem[]>([]);
  const [selected, setSelected] = useState<SavedReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const loadLive = useCallback(async () => {
    const data = await api<{ members: LiveMember[] }>("/lead/live");
    setLive(data.members);
  }, []);

  const loadToday = useCallback(async () => {
    const data = await api<TeamDayPayload>("/lead/today");
    setToday(data);
  }, []);

  const loadSaved = useCallback(async () => {
    const data = await api<{ reports: SavedReportListItem[] }>("/reports");
    setSaved(data.reports);
  }, []);

  useEffect(() => {
    let cancelled = false;
    Promise.all([loadLive(), loadToday(), loadSaved()]).catch((err: Error) => {
      if (!cancelled) setError(err.message);
    });
    const id = window.setInterval(() => {
      void loadLive().catch((err: Error) => setError(err.message));
      if (!selected) {
        void loadToday().catch((err: Error) => setError(err.message));
      }
    }, 5000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [loadLive, loadToday, loadSaved, selected]);

  async function saveReport() {
    setSaving(true);
    setError(null);
    try {
      const report = await api<SavedReport>("/reports", { method: "POST" });
      setSelected(null);
      await Promise.all([loadSaved(), loadToday()]);
      setSelected(report);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save report");
    } finally {
      setSaving(false);
    }
  }

  async function openSaved(dayKey: string) {
    setError(null);
    try {
      setSelected(await api<SavedReport>(`/reports/${dayKey}`));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not open report");
    }
  }

  const report = selected?.payload ?? today;

  return (
    <section className="team-view">
      {error ? <p className="banner banner--error">{error}</p> : null}

      <section className="panel">
        <header className="report__header">
          <p className="eyebrow">Live</p>
          <h2>Who is working now</h2>
          <p className="report__lede">Updates every few seconds from the team’s current timers.</p>
        </header>
        {live.length === 0 ? (
          <p className="empty">No teammates yet.</p>
        ) : (
          <ul className="live-board">
            {live.map((member) => (
              <li key={member.id} className={member.currentSession ? "live-card live-card--active" : "live-card"}>
                <p className="task-card__status">
                  {member.currentSession ? "Working" : "Idle"}
                </p>
                <h3>{member.name}</h3>
                {member.currentSession ? (
                  <>
                    <p>{member.currentSession.taskTitle}</p>
                    <p className="muted">
                      Started {formatClock(member.currentSession.startAt)}
                      {member.currentSession.note ? ` · ${member.currentSession.note}` : ""}
                    </p>
                  </>
                ) : (
                  <p className="muted">Not on a timed task</p>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="panel no-print">
        <header className="report__header">
          <p className="eyebrow">Saved reports</p>
          <h2>End-of-day snapshots</h2>
          <p className="report__lede">
            Save today’s full team log to the database. Reopen a saved day below.
          </p>
          <div className="action-row">
            <button type="button" className="btn btn--primary" onClick={() => void saveReport()} disabled={saving}>
              {saving ? "Saving…" : "Save team report"}
            </button>
            {selected ? (
              <button type="button" className="btn btn--ghost" onClick={() => setSelected(null)}>
                Back to live today
              </button>
            ) : null}
          </div>
        </header>
        {saved.length === 0 ? (
          <p className="empty">No reports saved yet.</p>
        ) : (
          <ul className="saved-list">
            {saved.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  className={
                    selected?.dayKey === item.dayKey ? "saved-link saved-link--active" : "saved-link"
                  }
                  onClick={() => void openSaved(item.dayKey)}
                >
                  <strong>{formatLongDate(parseDay(item.dayKey))}</strong>
                  <span>
                    Saved by {item.savedBy} at {formatClock(item.savedAt)}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {report ? (
        <section>
          <header className="report__header">
            <p className="eyebrow">{selected ? "Saved snapshot" : "Today"}</p>
            <h2>
              {selected
                ? `Team report — ${formatLongDate(parseDay(selected.dayKey))}`
                : `Team work log — ${formatLongDate()}`}
            </h2>
            {selected ? (
              <p className="report__lede">
                Snapshot saved by {selected.savedBy} at {formatClock(selected.savedAt)}.
              </p>
            ) : (
              <p className="report__lede">
                Live completed tasks and full session logs for everyone on {report.teamName}.
              </p>
            )}
          </header>

          {report.members.map((member) => (
            <article key={member.id} className="member-report">
              <div className="member-report__head">
                <h3>{member.name}</h3>
                <p className="muted">
                  {formatDuration(member.totals.totalMs)} · {member.totals.taskCount} tasks ·{" "}
                  {member.completedTasks.length} done
                </p>
              </div>
              {member.completedTasks.length > 0 ? (
                <ul className="report__by-task">
                  {member.completedTasks.map((task) => (
                    <li key={task.id}>
                      <span>{task.title}</span>
                      <strong>Done</strong>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="empty">No completed tasks yet.</p>
              )}
              <DailyReport
                tasks={member.tasks}
                sessions={member.sessions}
                now={Date.now()}
                heading={`${member.name} — session log`}
                compact
              />
            </article>
          ))}
        </section>
      ) : (
        <p className="empty">Loading team log…</p>
      )}
    </section>
  );
}
