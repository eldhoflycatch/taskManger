# Daylog — Team Task Manager

A multi-user task manager for teams. People sign in, join a team, track today’s work with timers and notes, and the team lead can see who is working now, review everyone’s end-of-day logs, and save the full team report in SQLite.

There is no cloud host or email invite flow. The API and database run on your machine.

## How the app works

**Accounts and teams**
1. Register (name, email, password) or log in.
2. Create a team (you become the **lead** and get an invite code) or **join** with a code from your lead.
3. Each person belongs to one team. Members only see their own tasks.

**Members**
1. Add today’s tasks on **Today**.
2. **Start** a task when you begin. Only one timer runs at a time.
3. Add an optional session note while you work.
4. **Stop** or **Mark done**.
5. Open **My report** for your session log, durations, and totals.

**Team lead**
- Can log their own work like any member.
- Open **Team** to see who is on a timer right now (refreshes every few seconds).
- See each teammate’s completed tasks and full session logs for today.
- **Save team report** writes a snapshot to the database. Reopen a saved day from the list.

Old browser-only `localStorage` data from the first version is not migrated.

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
