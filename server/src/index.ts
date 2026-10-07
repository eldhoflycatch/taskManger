import express from "express";
import cookieParser from "cookie-parser";
import { errorHandler, requireAuth } from "./middleware";
import { meResponse } from "./me";
import { authRouter } from "./routes/auth";
import { leadRouter } from "./routes/lead";
import { reportsRouter } from "./routes/reports";
import { sessionsRouter, tasksRouter } from "./routes/tasks";
import { teamsRouter } from "./routes/teams";
import "./db";

const app = express();
const port = Number(process.env.PORT) || 3001;

app.use(express.json());
app.use(cookieParser());

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.use("/api/auth", authRouter);
app.get("/api/me", requireAuth, (req, res) => {
  res.json(meResponse(req.user!, req.membership));
});
app.use("/api/teams", teamsRouter);
app.use("/api/tasks", tasksRouter);
app.use("/api/sessions", sessionsRouter);
app.use("/api/lead", leadRouter);
app.use("/api/reports", reportsRouter);

app.use(errorHandler);

app.listen(port, "127.0.0.1", () => {
  console.log(`Daylog API listening on http://127.0.0.1:${port}`);
});
