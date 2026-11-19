# Daylog — Team Task Manager

A multi-user task manager for teams. People sign in, join a team, track today’s work with timers and notes, and the team lead can see who is working now, review everyone’s end-of-day logs, and save the full team report in SQLite.

There is no cloud host or email invite flow. The API and database run on your machine.

## How the app works

**Roles** (chosen at registration)
- **Manager** — creates one or more teams, each with an invite code, and views/exports their members' work.
- **Team member** — joins one team with the manager's invite code and logs daily tasks.

**Members**
1. Add today's tasks on **Today**; **Start** one (only one timer runs at a time), add session notes, then **Stop** or **Mark done**.
2. **My report** shows your session log, durations and totals.

**Managers**
- Switch between their teams, add new ones, and share each team's invite code.
- **Team activity**: who is on a timer now, each member's tasks and sessions for today, and saved end-of-day snapshots.
- **Export reports**: pick a date range (and optionally one member), then download a **PDF** or **Excel (.xlsx)** with tasks, status, time spent and session notes. The Excel file also has a per-member summary sheet.

Existing databases are migrated automatically: former team leads become managers who own their team.

## How to get it running

**Prerequisites:** Node.js 18+ and npm.

```bash
npm install
npm run dev
```

That starts the API (`http://127.0.0.1:3001`) and the UI. Open the Vite URL (usually `http://localhost:5173`).

The SQLite file is created at `server/data/daylog.db` on first run.

To preview a production UI build (API still needed separately):

```bash
npm run build
npm run preview
```
