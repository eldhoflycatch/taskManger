import { useState, type FormEvent } from "react";
import type { ManagedTeam } from "../types";
import { ExportPanel } from "./ExportPanel";
import { TeamDashboard } from "./TeamDashboard";

type Props = {
  teams: ManagedTeam[];
  onCreateTeam: (name: string) => Promise<void>;
};

export function ManagerApp({ teams, onCreateTeam }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [tab, setTab] = useState<"team" | "export">("team");
  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const team = teams.find((t) => t.id === selectedId) ?? teams[0];

  async function handleCreate(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setCreating(true);
    try {
      await onCreateTeam(name.trim());
      setName("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create team");
    } finally {
      setCreating(false);
    }
  }

  return (
    <main>
      <section className="panel no-print">
        <h2>Your teams</h2>
        {teams.length > 0 ? (
          <div className="team-switcher">
            {teams.map((t) => (
              <button
                key={t.id}
                type="button"
                className={t.id === team?.id ? "tab tab--active" : "tab"}
                onClick={() => setSelectedId(t.id)}
              >
                {t.name} · {t.memberCount}
              </button>
            ))}
          </div>
        ) : (
          <p className="muted">Create your first team, then share its invite code with your members.</p>
        )}
        {error ? <p className="banner banner--error">{error}</p> : null}
        <form className="action-row" onSubmit={handleCreate}>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="New team name"
            required
          />
          <button type="submit" className="btn btn--ghost" disabled={creating}>
            {creating ? "Creating…" : "Add team"}
          </button>
        </form>
        {team ? (
          <p className="invite">
            Invite code for {team.name}: <code>{team.inviteCode}</code>
          </p>
        ) : null}
      </section>

      {team ? (
        <>
          <nav className="tabs no-print" aria-label="Manager views">
            <button type="button" className={tab === "team" ? "tab tab--active" : "tab"} onClick={() => setTab("team")}>
              Team activity
            </button>
            <button type="button" className={tab === "export" ? "tab tab--active" : "tab"} onClick={() => setTab("export")}>
              Export reports
            </button>
          </nav>
          {tab === "team" ? (
            <TeamDashboard key={team.id} teamId={team.id} />
          ) : (
            <ExportPanel teamId={team.id} teamName={team.name} />
          )}
        </>
      ) : null}
    </main>
  );
}
