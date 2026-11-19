import { useState, type FormEvent } from "react";

type TeamSetupProps = {
  userName: string;
  onJoin: (inviteCode: string) => Promise<void>;
  onLogout: () => Promise<void>;
};

export function TeamSetup({ userName, onJoin, onLogout }: TeamSetupProps) {
  const [inviteCode, setInviteCode] = useState("");
  const [pending, setPending] = useState<"join" | null>(null);
  const [error, setError] = useState<string | null>(null);

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
          <h1>Join your team</h1>
          <p className="masthead__date">
            Enter the invite code your manager shared with you.
          </p>
        </div>
        <button type="button" className="btn btn--ghost no-print" onClick={() => void onLogout()}>
          Log out
        </button>
      </header>

      {error ? <p className="banner banner--error">{error}</p> : null}

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
