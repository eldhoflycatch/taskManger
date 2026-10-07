import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { api } from "../api";
import type { WorkPayload } from "../types";

const empty: WorkPayload = {
  tasks: [],
  sessions: [],
  activeSessionId: null,
};

export function useTaskStore(enabled: boolean) {
  const [work, setWork] = useState<WorkPayload>(empty);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const noteTimer = useRef<number | undefined>(undefined);

  const apply = useCallback((payload: WorkPayload) => {
    setWork(payload);
  }, []);

  const refresh = useCallback(async () => {
    const payload = await api<WorkPayload>("/tasks");
    apply(payload);
    return payload;
  }, [apply]);

  useEffect(() => {
    if (!enabled) {
      setWork(empty);
      return;
    }
    let cancelled = false;
    setLoading(true);
    refresh()
      .catch((err: Error) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [enabled, refresh]);

  useEffect(() => {
    return () => {
      if (noteTimer.current) window.clearTimeout(noteTimer.current);
    };
  }, []);

  const run = useCallback(
    async (fn: () => Promise<WorkPayload>) => {
      setError(null);
      try {
        apply(await fn());
      } catch (err) {
        setError(err instanceof Error ? err.message : "Request failed");
      }
    },
    [apply],
  );

  const addTask = useCallback(
    (title: string, description?: string) => {
      void run(() =>
        api<WorkPayload>("/tasks", {
          method: "POST",
          body: JSON.stringify({ title, description }),
        }),
      );
    },
    [run],
  );

  const markDone = useCallback(
    (taskId: string) => {
      void run(() =>
        api<WorkPayload>(`/tasks/${taskId}/done`, { method: "PATCH" }),
      );
    },
    [run],
  );

  const startTask = useCallback(
    (taskId: string) => {
      void run(() =>
        api<WorkPayload>(`/tasks/${taskId}/start`, { method: "POST" }),
      );
    },
    [run],
  );

  const stopActive = useCallback(() => {
    void run(() => api<WorkPayload>("/sessions/stop", { method: "POST" }));
  }, [run]);

  const updateSessionNote = useCallback(
    (sessionId: string, note: string) => {
      setWork((prev) => ({
        ...prev,
        sessions: prev.sessions.map((session) =>
          session.id === sessionId ? { ...session, note } : session,
        ),
      }));
      if (noteTimer.current) window.clearTimeout(noteTimer.current);
      noteTimer.current = window.setTimeout(() => {
        void api<WorkPayload>(`/sessions/${sessionId}/note`, {
          method: "PATCH",
          body: JSON.stringify({ note }),
        }).catch((err: Error) => setError(err.message));
      }, 400);
    },
    [],
  );

  const activeSession = useMemo(
    () =>
      work.sessions.find((session) => session.id === work.activeSessionId) ??
      null,
    [work.sessions, work.activeSessionId],
  );

  return {
    todaysTasks: work.tasks,
    todaysSessions: work.sessions,
    activeSessionId: work.activeSessionId,
    activeSession,
    loading,
    error,
    addTask,
    markDone,
    startTask,
    stopActive,
    updateSessionNote,
  };
}
