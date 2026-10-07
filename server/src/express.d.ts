import type { MembershipRow, UserRow } from "./types";

declare global {
  namespace Express {
    interface Request {
      user?: Omit<UserRow, "password_hash">;
      membership?: MembershipRow;
    }
  }
}

export {};
