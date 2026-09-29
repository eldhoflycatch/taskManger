import type { Store } from "./types";

const STORAGE_KEY = "taskmanager:v1";

const emptyStore = (): Store => ({
  tasks: [],
  sessions: [],
  activeSessionId: null,
});

function isStore(value: unknown): value is Store {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Store;
  return (
    Array.isArray(candidate.tasks) &&
    Array.isArray(candidate.sessions) &&
    (candidate.activeSessionId === null ||
      typeof candidate.activeSessionId === "string")
  );
}

export function loadStore(): Store {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyStore();
    const parsed: unknown = JSON.parse(raw);
    return isStore(parsed) ? parsed : emptyStore();
  } catch {
    return emptyStore();
  }
}

export function saveStore(store: Store): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}
