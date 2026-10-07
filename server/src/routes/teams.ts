import { Router } from "express";
import { db } from "../db";
import { asyncHandler, requireAuth } from "../middleware";
import { meResponse } from "../me";
import { getMembership, getTeamByInvite } from "../queries";
import { createId, HttpError, inviteCode } from "../util";

export const teamsRouter = Router();

teamsRouter.get("/current", requireAuth, (req, res) => {
  res.json(meResponse(req.user!, req.membership));
});

teamsRouter.post(
  "/",
  requireAuth,
  asyncHandler(async (req, res) => {
    if (req.membership) {
      throw new HttpError(409, "You already belong to a team");
    }
    const name = String(req.body?.name ?? "").trim();
    if (!name) {
      throw new HttpError(400, "Team name is required");
    }

    const team = {
      id: createId(),
      name,
      invite_code: inviteCode(),
      created_at: new Date().toISOString(),
    };

    for (let attempt = 0; attempt < 5; attempt += 1) {
      const clash = getTeamByInvite(team.invite_code);
      if (!clash) break;
      team.invite_code = inviteCode();
    }

    const join = db.transaction(() => {
      db.prepare(
        "INSERT INTO teams (id, name, invite_code, created_at) VALUES (?, ?, ?, ?)",
      ).run(team.id, team.name, team.invite_code, team.created_at);
      db.prepare(
        "INSERT INTO memberships (user_id, team_id, role) VALUES (?, ?, 'lead')",
      ).run(req.user!.id, team.id);
    });
    join();

    res.status(201).json(meResponse(req.user!, getMembership(req.user!.id)));
  }),
);

teamsRouter.post(
  "/join",
  requireAuth,
  asyncHandler(async (req, res) => {
    if (req.membership) {
      throw new HttpError(409, "You already belong to a team");
    }
    const code = String(req.body?.inviteCode ?? "")
      .trim()
      .toUpperCase()
      .replace(/\s+/g, "");
    if (!code) {
      throw new HttpError(400, "Invite code is required");
    }
    const team = getTeamByInvite(code);
    if (!team) {
      throw new HttpError(404, "No team matches that invite code");
    }

    db.prepare(
      "INSERT INTO memberships (user_id, team_id, role) VALUES (?, ?, 'member')",
    ).run(req.user!.id, team.id);

    res.json(meResponse(req.user!, getMembership(req.user!.id)));
  }),
);
