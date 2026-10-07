import { Router } from "express";
import { db } from "../db";
import { asyncHandler, requireAuth, requireTeam } from "../middleware";
import {
  getOpenSession,
  getSession,
  getTask,
  getUserSessions,
  getUserTasks,
} from "../queries";
import { todayKey } from "../time";
import { createId, HttpError, mapSession, mapTask } from "../util";

export const tasksRouter = Router();

function workPayload(userId: string, day: string = todayKey()) {
  const tasks = getUserTasks(userId, day).map(mapTask);
  const sessions = getUserSessions(userId, day).map(mapSession);
  const open = getOpenSession(userId);
  return {
    tasks,
    sessions,
    activeSessionId: open?.id ?? null,
  };
}

function stopOpenSession(userId: string, now: string) {
  const open = getOpenSession(userId);
  if (!open) return;
  db.prepare("UPDATE sessions SET end_at = ? WHERE id = ?").run(now, open.id);
  const task = getTask(open.task_id);
  if (task && task.status === "in_progress") {
    db.prepare("UPDATE tasks SET status = 'todo' WHERE id = ?").run(task.id);
  }
}

tasksRouter.get(
  "/",
  requireAuth,
  requireTeam,
  (req, res) => {
    res.json(workPayload(req.user!.id));
  },
);

tasksRouter.post(
  "/",
  requireAuth,
  requireTeam,
  asyncHandler(async (req, res) => {
    const title = String(req.body?.title ?? "").trim();
    const description = String(req.body?.description ?? "").trim();
    if (!title) {
      throw new HttpError(400, "Task title is required");
    }
    const task = {
      id: createId(),
      user_id: req.user!.id,
      team_id: req.membership!.team_id,
      title,
      description: description || null,
      created_at: new Date().toISOString(),
      day_key: todayKey(),
      status: "todo" as const,
    };
    db.prepare(
      `INSERT INTO tasks (id, user_id, team_id, title, description, created_at, day_key, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    ).run(
      task.id,
      task.user_id,
      task.team_id,
      task.title,
      task.description,
      task.created_at,
      task.day_key,
      task.status,
    );
    res.status(201).json(workPayload(req.user!.id));
  }),
);

tasksRouter.post(
  "/:id/start",
  requireAuth,
  requireTeam,
  asyncHandler(async (req, res) => {
    const task = getTask(req.params.id);
    if (!task || task.user_id !== req.user!.id) {
      throw new HttpError(404, "Task not found");
    }
    if (task.status === "done") {
      throw new HttpError(400, "That task is already done");
    }

    const now = new Date().toISOString();
    const run = db.transaction(() => {
      stopOpenSession(req.user!.id, now);
      const sessionId = createId();
      db.prepare(
        `INSERT INTO sessions
          (id, user_id, team_id, task_id, task_title, start_at, end_at, note, day_key)
         VALUES (?, ?, ?, ?, ?, ?, NULL, '', ?)`,
      ).run(
        sessionId,
        req.user!.id,
        req.membership!.team_id,
        task.id,
        task.title,
        now,
        todayKey(),
      );
      db.prepare("UPDATE tasks SET status = 'in_progress' WHERE id = ?").run(task.id);
    });
    run();
    res.json(workPayload(req.user!.id));
  }),
);

tasksRouter.patch(
  "/:id/done",
  requireAuth,
  requireTeam,
  asyncHandler(async (req, res) => {
    const task = getTask(req.params.id);
    if (!task || task.user_id !== req.user!.id) {
      throw new HttpError(404, "Task not found");
    }
    const now = new Date().toISOString();
    const run = db.transaction(() => {
      const open = getOpenSession(req.user!.id);
      if (open?.task_id === task.id) {
        db.prepare("UPDATE sessions SET end_at = ? WHERE id = ?").run(now, open.id);
      }
      db.prepare("UPDATE tasks SET status = 'done' WHERE id = ?").run(task.id);
    });
    run();
    res.json(workPayload(req.user!.id));
  }),
);

export const sessionsRouter = Router();

sessionsRouter.post(
  "/stop",
  requireAuth,
  requireTeam,
  asyncHandler(async (req, res) => {
    const open = getOpenSession(req.user!.id);
    if (!open) {
      throw new HttpError(400, "No session is running");
    }
    const now = new Date().toISOString();
    const run = db.transaction(() => {
      stopOpenSession(req.user!.id, now);
    });
    run();
    res.json(workPayload(req.user!.id));
  }),
);

sessionsRouter.patch(
  "/:id/note",
  requireAuth,
  requireTeam,
  asyncHandler(async (req, res) => {
    const session = getSession(req.params.id);
    if (!session || session.user_id !== req.user!.id) {
      throw new HttpError(404, "Session not found");
    }
    const note = String(req.body?.note ?? "");
    db.prepare("UPDATE sessions SET note = ? WHERE id = ?").run(note, session.id);
    res.json(workPayload(req.user!.id));
  }),
);
