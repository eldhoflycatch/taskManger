# Daylog — Daily Task Manager

A browser-only app for today's to-dos, live time tracking, and an end-of-day work log. There is no backend or login. Everything is stored in this browser (`localStorage`).

## How the app works

1. **Add today's tasks** on the Today view (title required, description optional).
2. **Start** a task when you begin work. Only one timer runs at a time. Starting another task stops the current session first.
3. While a session is running, add an optional **session note** (what you did in that block of time). Notes save as you type.
4. **Stop** when you pause, or **Mark done** when the task is finished. Done tasks stay on the list and still appear in the report.
5. Open **End of day report** for the full work log: each session's task name, start time, end time (or "Running"), duration, and notes. The report also shows total tracked time, task count, session count, and time per task.
6. Use **Print / save as PDF** on the report if you want a copy of the day.

Refreshing the page keeps your tasks and a running timer (the clock is calculated from the stored start time). Clearing this site's data in the browser wipes the logs.

The first screen is always **today**. Older days remain in storage but are not shown in this version.

## How to get it running

**Prerequisites:** Node.js 18+ and npm.

```bash
npm install
npm run dev
```

Open the local URL Vite prints (usually `http://localhost:5173`).

To preview a production build:

```bash
npm run build
npm run preview
```
