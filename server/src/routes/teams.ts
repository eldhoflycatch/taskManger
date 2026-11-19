import { Router } from "express";
import { db } from "../db";
import { asyncHandler, requireAuth, requireManager } from "../middleware";
import { meResponse } from "../me";
import { getManagedTeam, getMembership, getTeamByInvite, listTeamMembers } from "../queries";
import { createId, HttpError, inviteCode } from "../util";

export const teamsRouter = Router();

teamsRouter.get("/current", requireAuth, (req, res) => {
  res.json(meResponse(req.user!, req.membership));
});

teamsRouter.post(
  "/",
  requireAuth,
  requireManager,
  asyncHandler(async (req, res) => {
    const name = String(req.body?.name ?? "").trim();
    if (!name) {
      throw new HttpError(400, "Team name is required");
    }

    const team = {
      id: createId(),
      name,
      invite_code: inviteCode(),
      manager_id: req.user!.id,
      created_at: new Date().toISOString(),
    };

    for (let attempt = 0; attempt < 5; attempt += 1) {
      const clash = getTeamByInvite(team.invite_code);
      if (!clash) break;
      team.invite_code = inviteCode();
    }

    db.prepare(
      "INSERT INTO teams (id, name, invite_code, manager_id, created_at) VALUES (?, ?, ?, ?, ?)",
    ).run(team.id, team.name, team.invite_code, team.manager_id, team.created_at);

    res.status(201).json(meResponse(req.user!));
  }),
);

teamsRouter.post(
  "/join",
  requireAuth,
  asyncHandler(async (req, res) => {
    if (req.user!.role !== "member") {
      throw new HttpError(403, "Managers create teams; members join them");
    }
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

teamsRouter.get("/:teamId/members", requireAuth, requireManager, (req, res) => {
  const team = getManagedTeam(req.user!.id, req.params.teamId);
  if (!team) throw new HttpError(404, "Team not found");
  res.json({ members: listTeamMembers(team.id) });
});

teamsRouter.delete(
  "/:teamId/members/:userId",
  requireAuth,
  requireManager,
  (req, res) => {
    const team = getManagedTeam(req.user!.id, req.params.teamId);
    if (!team) throw new HttpError(404, "Team not found");
    const result = db
      .prepare("DELETE FROM memberships WHERE team_id = ? AND user_id = ?")
      .run(team.id, req.params.userId);
    if (result.changes === 0) throw new HttpError(404, "Member not found");
    res.status(204).end();
  },
);
