import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { db } from "../db";
import {
  asyncHandler,
  COOKIE_NAME,
  JWT_SECRET,
  requireAuth,
} from "../middleware";
import { meResponse } from "../me";
import { getMembership, getUserByEmail } from "../queries";
import { createId, HttpError } from "../util";

export const authRouter = Router();

function setAuthCookie(res: import("express").Response, userId: string) {
  const token = jwt.sign({ userId }, JWT_SECRET, { expiresIn: "7d" });
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}

authRouter.post(
  "/register",
  asyncHandler(async (req, res) => {
    const name = String(req.body?.name ?? "").trim();
    const email = String(req.body?.email ?? "").trim().toLowerCase();
    const password = String(req.body?.password ?? "");

    if (!name || !email || !password) {
      throw new HttpError(400, "Name, email, and password are required");
    }
    if (!email.includes("@")) {
      throw new HttpError(400, "Enter a valid email");
    }
    if (password.length < 6) {
      throw new HttpError(400, "Password must be at least 6 characters");
    }
    if (getUserByEmail(email)) {
      throw new HttpError(409, "An account with that email already exists");
    }

    const user = {
      id: createId(),
      name,
      email,
      password_hash: await bcrypt.hash(password, 10),
      created_at: new Date().toISOString(),
    };
    db.prepare(
      "INSERT INTO users (id, name, email, password_hash, created_at) VALUES (?, ?, ?, ?, ?)",
    ).run(user.id, user.name, user.email, user.password_hash, user.created_at);

    setAuthCookie(res, user.id);
    res.status(201).json(meResponse(user));
  }),
);

authRouter.post(
  "/login",
  asyncHandler(async (req, res) => {
    const email = String(req.body?.email ?? "").trim().toLowerCase();
    const password = String(req.body?.password ?? "");
    const user = getUserByEmail(email);
    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      throw new HttpError(401, "Invalid email or password");
    }
    setAuthCookie(res, user.id);
    res.json(meResponse(user, getMembership(user.id)));
  }),
);

authRouter.post("/logout", (_req, res) => {
  res.clearCookie(COOKIE_NAME, { path: "/" });
  res.status(204).end();
});

authRouter.get("/me", requireAuth, (req, res) => {
  res.json(meResponse(req.user!, req.membership));
});
