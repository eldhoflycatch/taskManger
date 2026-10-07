import { Router } from "express";
import { db } from "../db";
import { asyncHandler, requireAuth, requireLead, requireTeam } from "../middleware";
import { buildTeamDay, getTeam } from "../queries";
import { todayKey } from "../time";
import { createId, HttpError } from "../util";

export const reportsRouter = Router();

reportsRouter.post(
  "/",
  requireAuth,
  requireTeam,
  requireLead,
  asyncHandler(async (req, res) => {
    const team = getTeam(req.membership!.team_id)!;
    const day = todayKey();
    const payload = buildTeamDay(team, day);
    const savedAt = new Date().toISOString();
    const id = createId();

    db.prepare(
      `INSERT INTO daily_reports (id, team_id, day_key, saved_by, saved_at, payload)
       VALUES (?, ?, ?, ?, ?, ?)
       ON CONFLICT(team_id, day_key) DO UPDATE SET
         saved_by = excluded.saved_by,
         saved_at = excluded.saved_at,
         payload = excluded.payload`,
    ).run(
      id,
      team.id,
      day,
      req.user!.id,
      savedAt,
      JSON.stringify(payload),
    );

    const row = db
      .prepare(
        "SELECT id, day_key, saved_at, payload FROM daily_reports WHERE team_id = ? AND day_key = ?",
      )
      .get(team.id, day) as {
      id: string;
      day_key: string;
      saved_at: string;
      payload: string;
    };

    res.status(201).json({
      id: row.id,
      dayKey: row.day_key,
      savedAt: row.saved_at,
      savedBy: req.user!.name,
      payload: JSON.parse(row.payload),
    });
  }),
);

reportsRouter.get("/", requireAuth, requireTeam, requireLead, (req, res) => {
  const rows = db
    .prepare(
      `SELECT r.id, r.day_key, r.saved_at, u.name AS saved_by
       FROM daily_reports r
       JOIN users u ON u.id = r.saved_by
       WHERE r.team_id = ?
       ORDER BY r.day_key DESC`,
    )
    .all(req.membership!.team_id) as {
    id: string;
    day_key: string;
    saved_at: string;
    saved_by: string;
  }[];

  res.json({
    reports: rows.map((row) => ({
      id: row.id,
      dayKey: row.day_key,
      savedAt: row.saved_at,
      savedBy: row.saved_by,
    })),
  });
});

reportsRouter.get(
  "/:dayKey",
  requireAuth,
  requireTeam,
  requireLead,
  asyncHandler(async (req, res) => {
    const row = db
      .prepare(
        `SELECT r.id, r.day_key, r.saved_at, r.payload, u.name AS saved_by
         FROM daily_reports r
         JOIN users u ON u.id = r.saved_by
         WHERE r.team_id = ? AND r.day_key = ?`,
      )
      .get(req.membership!.team_id, req.params.dayKey) as
      | {
          id: string;
          day_key: string;
          saved_at: string;
          payload: string;
          saved_by: string;
        }
      | undefined;

    if (!row) {
      throw new HttpError(404, "No saved report for that day");
    }

    res.json({
      id: row.id,
      dayKey: row.day_key,
      savedAt: row.saved_at,
      savedBy: row.saved_by,
      payload: JSON.parse(row.payload),
    });
  }),
);
