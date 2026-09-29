import { useState } from "react";
import { AddTaskForm } from "./components/AddTaskForm";
import { DailyReport } from "./components/DailyReport";
import { SessionNote } from "./components/SessionNote";
import { TaskList } from "./components/TaskList";
import { useNow } from "./hooks/useNow";
import { useTaskStore } from "./hooks/useTaskStore";
import { formatLongDate } from "./lib/time";

type View = "today" | "report";

export default function App() {
  const [view, setView] = useState<View>("today");
  const {
    store,
    todaysTasks,
    todaysSessions,
    activeSession,
    addTask,
    markDone,
    startTask,
    stopActive,
    updateSessionNote,
  } = useTaskStore();

  const now = useNow(Boolean(store.activeSessionId));

  return (
    <div className="app">
      <header className="masthead">
        <div>
          <p className="eyebrow">Daylog</p>
          <h1>Daily task manager</h1>
          <p className="masthead__date">{formatLongDate()}</p>
        </div>
        <nav className="tabs no-print" aria-label="Views">
          <button
            type="button"
            className={view === "today" ? "tab tab--active" : "tab"}
            onClick={() => setView("today")}
          >
            Today
          </button>
          <button
            type="button"
            className={view === "report" ? "tab tab--active" : "tab"}
            onClick={() => setView("report")}
          >
            End of day report
          </button>
        </nav>
      </header>

      <main>
        {view === "today" ? (
          <>
            <AddTaskForm onAdd={addTask} />
            {activeSession ? (
              <SessionNote
                session={activeSession}
                onChange={(note) => updateSessionNote(activeSession.id, note)}
              />
            ) : null}
            <TaskList
              tasks={todaysTasks}
              sessions={todaysSessions}
              activeSessionId={store.activeSessionId}
              now={now}
              onStart={startTask}
              onStop={stopActive}
              onDone={markDone}
            />
          </>
        ) : (
          <DailyReport
            tasks={todaysTasks}
            sessions={todaysSessions}
            now={now}
          />
        )}
      </main>
    </div>
  );
}
