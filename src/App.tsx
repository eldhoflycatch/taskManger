import { useState } from "react";
import { AddTaskForm } from "./components/AddTaskForm";
import { AuthScreen } from "./components/AuthScreen";
import { DailyReport } from "./components/DailyReport";
import { SessionNote } from "./components/SessionNote";
import { TaskList } from "./components/TaskList";
import { TeamDashboard } from "./components/TeamDashboard";
import { TeamSetup } from "./components/TeamSetup";
import { useAuth } from "./hooks/useAuth";
import { useNow } from "./hooks/useNow";
import { useTaskStore } from "./hooks/useTaskStore";
import { formatLongDate } from "./lib/time";

type View = "today" | "report" | "team";

export default function App() {
  const auth = useAuth();
  const inApp = Boolean(auth.me?.team);
  const isLead = auth.me?.team?.role === "lead";
  const [view, setView] = useState<View>("today");
  const {
    todaysTasks,
    todaysSessions,
    activeSessionId,
    activeSession,
    loading: workLoading,
    error: workError,
    addTask,
    markDone,
    startTask,
    stopActive,
    updateSessionNote,
  } = useTaskStore(inApp);

  const now = useNow(Boolean(activeSessionId));

  if (auth.loading) {
    return (
      <div className="app">
        <p className="empty">Loading…</p>
      </div>
    );
  }

  if (!auth.me) {
    return (
      <AuthScreen
        error={auth.error}
        onLogin={auth.login}
        onRegister={auth.register}
      />
    );
  }

  if (!auth.me.team) {
    return (
      <TeamSetup
        userName={auth.me.user.name}
        onCreate={auth.createTeam}
        onJoin={auth.joinTeam}
        onLogout={auth.logout}
      />
    );
  }

  const team = auth.me.team;
  const currentView = view === "team" && !isLead ? "today" : view;

  return (
    <div className="app">
      <header className="masthead">
        <div>
          <p className="eyebrow">Daylog</p>
          <h1>Daily task manager</h1>
          <p className="masthead__date">{formatLongDate()}</p>
        </div>
        <div className="userbar no-print">
          <p>
            <strong>{auth.me.user.name}</strong>
            <span className="muted">
              {" "}
              · {team.name} · {team.role === "lead" ? "Lead" : "Member"}
            </span>
          </p>
          {team.inviteCode ? (
            <p className="invite">
              Invite code <code>{team.inviteCode}</code>
            </p>
          ) : null}
          <button type="button" className="btn btn--ghost" onClick={() => void auth.logout()}>
            Log out
          </button>
        </div>
      </header>

      <nav className="tabs no-print" aria-label="Views">
        <button
          type="button"
          className={currentView === "today" ? "tab tab--active" : "tab"}
          onClick={() => setView("today")}
        >
          Today
        </button>
        <button
          type="button"
          className={currentView === "report" ? "tab tab--active" : "tab"}
          onClick={() => setView("report")}
        >
          My report
        </button>
        {isLead ? (
          <button
            type="button"
            className={currentView === "team" ? "tab tab--active" : "tab"}
            onClick={() => setView("team")}
          >
            Team
          </button>
        ) : null}
      </nav>

      <main>
        {workError ? <p className="banner banner--error">{workError}</p> : null}
        {currentView === "today" ? (
          <>
            <AddTaskForm onAdd={addTask} />
            {activeSession ? (
              <SessionNote
                session={activeSession}
                onChange={(note) => updateSessionNote(activeSession.id, note)}
              />
            ) : null}
            {workLoading && todaysTasks.length === 0 ? (
              <p className="empty">Loading tasks…</p>
            ) : (
              <TaskList
                tasks={todaysTasks}
                sessions={todaysSessions}
                activeSessionId={activeSessionId}
                now={now}
                onStart={startTask}
                onStop={stopActive}
                onDone={markDone}
              />
            )}
          </>
        ) : null}
        {currentView === "report" ? (
          <DailyReport
            tasks={todaysTasks}
            sessions={todaysSessions}
            now={now}
          />
        ) : null}
        {currentView === "team" && isLead ? <TeamDashboard /> : null}
      </main>
    </div>
  );
}
