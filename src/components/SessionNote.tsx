import type { WorkSession } from "../types";
import { formatClock } from "../lib/time";

type SessionNoteProps = {
  session: WorkSession;
  onChange: (note: string) => void;
};

export function SessionNote({ session, onChange }: SessionNoteProps) {
  return (
    <section className="session-note" aria-live="polite">
      <header>
        <p className="eyebrow">Working now</p>
        <h2>{session.taskTitle}</h2>
        <p className="session-note__meta">Started {formatClock(session.startAt)}</p>
      </header>
      <label className="field">
        <span>Session note</span>
        <textarea
          value={session.note}
          onChange={(event) => onChange(event.target.value)}
          placeholder="What are you doing in this block of time?"
          rows={3}
        />
      </label>
    </section>
  );
}
