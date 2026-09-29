import { useCallback, useEffect, useMemo, useState } from "react";
import { loadStore, saveStore } from "../storage";
import type { Store, Task, WorkSession } from "../types";
import { dayKeyFromIso, todayKey } from "../lib/time";

function createId(): string {
  return crypto.randomUUID();
}

export function useTaskStore() {
  const [store, setStore] = useState<Store>(() => loadStore());

  useEffect(() => {
    saveStore(store);
  }, [store]);

  const day = todayKey();

  const todaysTasks = useMemo(
    () => store.tasks.filter((task) => task.dayKey === day),
    [store.tasks, day],
  );

  const todaysSessions = useMemo(
    () =>
      store.sessions.filter((session) => dayKeyFromIso(session.startAt) === day),
    [store.sessions, day],
  );

  const activeSession = useMemo(
    () =>
      store.sessions.find((session) => session.id === store.activeSessionId) ??
      null,
    [store.sessions, store.activeSessionId],
  );

  const addTask = useCallback((title: string, description?: string) => {
    const trimmed = title.trim();
    if (!trimmed) return;

    const task: Task = {
      id: createId(),
      title: trimmed,
      description: description?.trim() || undefined,
      createdAt: new Date().toISOString(),
      dayKey: todayKey(),
      status: "todo",
    };

    setStore((prev) => ({ ...prev, tasks: [...prev.tasks, task] }));
  }, []);

  const markDone = useCallback((taskId: string) => {
    setStore((prev) => {
      const running = prev.sessions.find((s) => s.id === prev.activeSessionId);
      const shouldStop = running?.taskId === taskId;

      return {
        ...prev,
        activeSessionId: shouldStop ? null : prev.activeSessionId,
        tasks: prev.tasks.map((task) =>
          task.id === taskId ? { ...task, status: "done" } : task,
        ),
        sessions: shouldStop
          ? prev.sessions.map((session) =>
              session.id === prev.activeSessionId
                ? { ...session, endAt: new Date().toISOString() }
                : session,
            )
          : prev.sessions,
      };
    });
  }, []);

  const startTask = useCallback((taskId: string) => {
    setStore((prev) => {
      const task = prev.tasks.find((item) => item.id === taskId);
      if (!task || task.status === "done") return prev;

      const now = new Date().toISOString();
      let sessions = prev.sessions;
      let tasks = prev.tasks;

      if (prev.activeSessionId) {
        const running = sessions.find((s) => s.id === prev.activeSessionId);
        sessions = sessions.map((session) =>
          session.id === prev.activeSessionId
            ? { ...session, endAt: now }
            : session,
        );
        if (running) {
          tasks = tasks.map((item) =>
            item.id === running.taskId && item.status === "in_progress"
              ? { ...item, status: "todo" }
              : item,
          );
        }
      }

      const session: WorkSession = {
        id: createId(),
        taskId: task.id,
        taskTitle: task.title,
        startAt: now,
        endAt: null,
        note: "",
      };

      return {
        tasks: tasks.map((item) =>
          item.id === taskId && item.status !== "done"
            ? { ...item, status: "in_progress" }
            : item,
        ),
        sessions: [...sessions, session],
        activeSessionId: session.id,
      };
    });
  }, []);

  const stopActive = useCallback(() => {
    setStore((prev) => {
      if (!prev.activeSessionId) return prev;
      const running = prev.sessions.find((s) => s.id === prev.activeSessionId);
      const now = new Date().toISOString();

      return {
        ...prev,
        activeSessionId: null,
        sessions: prev.sessions.map((session) =>
          session.id === prev.activeSessionId
            ? { ...session, endAt: now }
            : session,
        ),
        tasks: prev.tasks.map((task) =>
          running &&
          task.id === running.taskId &&
          task.status === "in_progress"
            ? { ...task, status: "todo" }
            : task,
        ),
      };
    });
  }, []);

  const updateSessionNote = useCallback((sessionId: string, note: string) => {
    setStore((prev) => ({
      ...prev,
      sessions: prev.sessions.map((session) =>
        session.id === sessionId ? { ...session, note } : session,
      ),
    }));
  }, []);

  return {
    store,
    todaysTasks,
    todaysSessions,
    activeSession,
    addTask,
    markDone,
    startTask,
    stopActive,
    updateSessionNote,
  };
}
