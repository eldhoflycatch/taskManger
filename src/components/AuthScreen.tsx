import { useState, type FormEvent } from "react";
import type { UserRole } from "../types";

type AuthScreenProps = {
  error: string | null;
  onLogin: (email: string, password: string) => Promise<void>;
  onRegister: (name: string, email: string, password: string, role: UserRole) => Promise<void>;
};

export function AuthScreen({ error, onLogin, onRegister }: AuthScreenProps) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("member");
  const [pending, setPending] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setLocalError(null);
    setPending(true);
    try {
      if (mode === "register") {
        await onRegister(name, email, password, role);
      } else {
        await onLogin(email, password);
      }
    } catch (err) {
      setLocalError(err instanceof Error ? err.message : "Could not sign in");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="app app--narrow">
      <header className="masthead">
        <div>
          <p className="eyebrow">Daylog</p>
          <h1>Team task manager</h1>
          <p className="masthead__date">Sign in to track work with your team.</p>
        </div>
      </header>

      <section className="panel">
        <nav className="tabs" aria-label="Account">
          <button
            type="button"
            className={mode === "login" ? "tab tab--active" : "tab"}
            onClick={() => setMode("login")}
          >
            Log in
          </button>
          <button
            type="button"
            className={mode === "register" ? "tab tab--active" : "tab"}
            onClick={() => setMode("register")}
          >
            Register
          </button>
        </nav>

        <form className="stack" onSubmit={handleSubmit}>
          {mode === "register" ? (
            <label className="field">
              <span>Name</span>
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                autoComplete="name"
                required
              />
            </label>
          ) : null}
          {mode === "register" ? (
            <label className="field">
              <span>I am a</span>
              <select value={role} onChange={(event) => setRole(event.target.value as UserRole)}>
                <option value="member">Team member (log my daily tasks)</option>
                <option value="manager">Manager (view and export team reports)</option>
              </select>
            </label>
          ) : null}
          <label className="field">
            <span>Email</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              required
            />
          </label>
          <label className="field">
            <span>Password</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete={mode === "register" ? "new-password" : "current-password"}
              minLength={6}
              required
            />
          </label>
          {localError || error ? (
            <p className="banner banner--error">{localError || error}</p>
          ) : null}
          <button type="submit" className="btn btn--primary" disabled={pending}>
            {pending ? "Please wait…" : mode === "register" ? "Create account" : "Log in"}
          </button>
        </form>
      </section>
    </div>
  );
}
