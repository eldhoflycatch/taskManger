import { Router } from "express";
import { requireAuth, requireLead, requireTeam } from "../middleware";
import { getOpenSession, getTeam, listTeamMembers } from "../queries";
import { buildTeamDay } from "../queries";
import { mapSession } from "../util";

export const leadRouter = Router();

leadRouter.get("/live", requireAuth, requireTeam, requireLead, (req, res) => {
  const members = listTeamMembers(req.membership!.team_id).map((member) => {
    const open = getOpenSession(member.id);
    return {
      id: member.id,
      name: member.name,
      currentSession: open ? mapSession(open) : null,
    };
  });
  res.json({ members });
});

leadRouter.get("/today", requireAuth, requireTeam, requireLead, (req, res) => {
  const team = getTeam(req.membership!.team_id)!;
  res.json(buildTeamDay(team));
});
