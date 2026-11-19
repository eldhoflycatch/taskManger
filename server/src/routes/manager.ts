import { Router } from "express";
import { asyncHandler, requireAuth, requireManager } from "../middleware";
import {
  buildRangeRows,
  buildTeamDay,
  getManagedTeam,
  getOpenSession,
  listTeamMembers,
} from "../queries";
import { todayKey } from "../time";
import { HttpError, mapSession } from "../util";
import { buildExcel, buildPdf } from "../export";

export const managerRouter = Router();
managerRouter.use(requireAuth, requireManager);

function teamFor(req: import("express").Request) {
  const teamId = String(req.query.teamId ?? "");
  const team = getManagedTeam(req.user!.id, teamId);
  if (!team) throw new HttpError(404, "Team not found");
  return team;
}

function dayParam(value: unknown, fallback: string): string {
  const day = String(value ?? fallback);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day) || Number.isNaN(Date.parse(day))) {
    throw new HttpError(400, "Dates must be YYYY-MM-DD");
  }
  return day;
}

managerRouter.get("/live", (req, res) => {
  const team = teamFor(req);
  const members = listTeamMembers(team.id).map((member) => {
    const open = getOpenSession(member.id);
    return {
      id: member.id,
      name: member.name,
      currentSession: open ? mapSession(open) : null,
    };
  });
  res.json({ members });
});

managerRouter.get("/day", (req, res) => {
  const team = teamFor(req);
  res.json(buildTeamDay(team, dayParam(req.query.day, todayKey())));
});

managerRouter.get("/export", asyncHandler(async (req, res) => {
  const team = teamFor(req);
  const from = dayParam(req.query.from, todayKey());
  const to = dayParam(req.query.to, from);
  if (from > to) throw new HttpError(400, "'from' must not be after 'to'");
  if ((Date.parse(to) - Date.parse(from)) / 86_400_000 > 366) {
    throw new HttpError(400, "Date range is limited to one year");
  }
  const format = req.query.format === "xlsx" ? "xlsx" : req.query.format === "pdf" ? "pdf" : null;
  if (!format) throw new HttpError(400, "format must be pdf or xlsx");

  let memberId: string | undefined;
  let memberName: string | undefined;
  if (req.query.memberId) {
    const member = listTeamMembers(team.id).find((m) => m.id === String(req.query.memberId));
    if (!member) throw new HttpError(404, "Member not found in this team");
    memberId = member.id;
    memberName = member.name;
  }

  const rows = buildRangeRows(team, from, to, memberId);
  const meta = { teamName: team.name, from, to, memberName };
  const safe = team.name.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "") || "team";
  const filename = `${safe}-${from}${to !== from ? `_to_${to}` : ""}.${format}`;
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

  if (format === "xlsx") {
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.send(await buildExcel(rows, meta));
  } else {
    res.setHeader("Content-Type", "application/pdf");
    res.send(await buildPdf(rows, meta));
  }
}));
