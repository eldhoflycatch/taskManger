import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { getMembership, getUserById } from "./queries";
import { HttpError } from "./util";

export const JWT_SECRET = process.env.JWT_SECRET || "daylog-dev-secret";
export const COOKIE_NAME = "daylog_token";

type TokenPayload = { userId: string };

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = req.cookies?.[COOKIE_NAME];
  if (!token || typeof token !== "string") {
    res.status(401).json({ error: "Not signed in" });
    return;
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET) as TokenPayload;
    const user = getUserById(payload.userId);
    if (!user) {
      res.status(401).json({ error: "Not signed in" });
      return;
    }
    req.user = {
      id: user.id,
      name: user.name,
      email: user.email,
      created_at: user.created_at,
    };
    req.membership = getMembership(user.id);
    next();
  } catch {
    res.status(401).json({ error: "Not signed in" });
  }
}

export function requireTeam(req: Request, res: Response, next: NextFunction) {
  if (!req.membership) {
    res.status(403).json({ error: "Join a team first" });
    return;
  }
  next();
}

export function requireLead(req: Request, res: Response, next: NextFunction) {
  if (!req.membership || req.membership.role !== "lead") {
    res.status(403).json({ error: "Team lead only" });
    return;
  }
  next();
}

export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>,
) {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
}

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  if (err instanceof HttpError) {
    res.status(err.status).json({ error: err.message });
    return;
  }
  console.error(err);
  res.status(500).json({ error: "Server error" });
}
