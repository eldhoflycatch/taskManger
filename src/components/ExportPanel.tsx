import { useEffect, useState } from "react";
import { api } from "../api";
import { downloadReport } from "../lib/download";

type Member = { id: string; name: string };

function isoToday(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function ExportPanel({ teamId, teamName }: { teamId: string; teamName: string }) {
  const [from, setFrom] = useState(isoToday);
  const [to, setTo] = useState(isoToday);
  const [memberId, setMemberId] = useState("");
  const [members, setMembers] = useState<Member[]>([]);
  const [busy, setBusy] = useState<"pdf" | "xlsx" | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setMemberId("");
    api<{ members: Member[] }>(`/teams/${teamId}/members`)
      .then((d) => setMembers(d.members))
      .catch(() => setMembers([]));
  }, [teamId]);

  async function download(format: "pdf" | "xlsx") {
    setError(null);
    if (from > to) {
      setError("The start date must not be after the end date.");
      return;
    }
    setBusy(format);
    try {
      await downloadReport(
        "/manager/export",
        { teamId, from, to, format, memberId: memberId || undefined },
        `${teamName.replace(/[^a-z0-9]+/gi, "-")}-${from}${to !== from ? `_to_${to}` : ""}.${format}`,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Export failed");
    } finally {
      setBusy(null);
    }
  }

  return (
    <section className="panel no-print">
      <header className="report__header">
        <p className="eyebrow">Export</p>
        <h2>Download task report</h2>
        <p className="report__lede">
          Tasks, status, time spent and session notes for {teamName}, as a PDF or Excel file.
        </p>
      </header>
      {error ? <p className="banner banner--error">{error}</p> : null}
      <div className="export-grid">
        <label className="field">
          <span>From</span>
          <input type="date" value={from} max={to} onChange={(e) => setFrom(e.target.value)} />
        </label>
        <label className="field">
          <span>To</span>
          <input type="date" value={to} min={from} onChange={(e) => setTo(e.target.value)} />
        </label>
        <label className="field">
          <span>Team member</span>
          <select value={memberId} onChange={(e) => setMemberId(e.target.value)}>
            <option value="">All members</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="action-row">
        <button type="button" className="btn btn--primary" disabled={busy !== null} onClick={() => void download("pdf")}>
          {busy === "pdf" ? "Preparing…" : "Download PDF"}
        </button>
        <button type="button" className="btn btn--ghost" disabled={busy !== null} onClick={() => void download("xlsx")}>
          {busy === "xlsx" ? "Preparing…" : "Download Excel"}
        </button>
      </div>
    </section>
  );
}
