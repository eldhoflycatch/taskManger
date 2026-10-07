import { useState, type FormEvent } from "react";

type TeamSetupProps = {
  userName: string;
  onCreate: (name: string) => Promise<void>;
  onJoin: (inviteCode: string) => Promise<void>;
  onLogout: () => Promise<void>;
};

export function TeamSetup({ userName, onCreate, onJoin, onLogout }: TeamSetupProps) {
  const [teamName, setTeamName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [pending, setPending] = useState<"create" | "join" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleCreate(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setPending("create");
    try {
      await onCreate(teamName);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create team");
    } finally {
      setPending(null);
    }
  }

  async function handleJoin(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setPending("join");
    try {
      await onJoin(inviteCode);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not join team");
    } finally {
      setPending(null);
    }
  }

  return (
    <div className="app app--narrow">
      <header className="masthead">
        <div>
          <p className="eyebrow">Welcome, {userName}</p>
          <h1>Join or create a team</h1>
          <p className="masthead__date">
            Create a team to become the lead, or enter an invite code from your lead.
          </p>
        </div>
        <button type="button" className="btn btn--ghost no-print" onClick={() => void onLogout()}>
          Log out
        </button>
      </header>

      {error ? <p className="banner banner--error">{error}</p> : null}

      <section className="panel">
        <h2>Create a team</h2>
        <p className="muted">You will be the team lead and get an invite code to share.</p>
        <form className="stack" onSubmit={handleCreate}>
          <label className="field">
            <span>Team name</span>
            <input
              value={teamName}
              onChange={(event) => setTeamName(event.target.value)}
              placeholder="Design squad"
              required
            />
          </label>
          <button type="submit" className="btn btn--primary" disabled={pending !== null}>
            {pending === "create" ? "Creating…" : "Create team"}
          </button>
        </form>
      </section>

      <section className="panel">
        <h2>Join a team</h2>
        <form className="stack" onSubmit={handleJoin}>
          <label className="field">
            <span>Invite code</span>
            <input
              value={inviteCode}
              onChange={(event) => setInviteCode(event.target.value.toUpperCase())}
              placeholder="AB12CD34"
              required
            />
          </label>
          <button type="submit" className="btn btn--ghost" disabled={pending !== null}>
            {pending === "join" ? "Joining…" : "Join team"}
          </button>
        </form>
      </section>
    </div>
  );
}
