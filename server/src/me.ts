import { getTeam, listManagedTeams } from "./queries";
import type { MembershipRow, UserRow } from "./types";
import type { MeResponse } from "./types";
import { publicUser, teamSummary } from "./util";

export function meResponse(
  user: Pick<UserRow, "id" | "name" | "email" | "role">,
  membership?: MembershipRow,
): MeResponse {
  const team = membership ? getTeam(membership.team_id) : undefined;
  return {
    user: publicUser(user as UserRow),
    team: team && membership ? teamSummary(team, membership) : null,
    managedTeams: user.role === "manager" ? listManagedTeams(user.id) : [],
  };
}
