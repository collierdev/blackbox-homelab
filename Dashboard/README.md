# Pi Dashboard

Self-hosted dashboard for system stats, smart home control, planner, and calendar sync/import.

## Quick Start (Docker)

1. Copy the environment template:
   - `cp .env.example .env`
2. Edit only the values you actually need in `.env`:
   - `NEO4J_PASSWORD`
   - `ENCRYPTION_SECRET`
   - `HA_URL` / `HA_TOKEN` (if using Home Assistant)
   - `HOST_HOME_PATH` (if your Linux home path is not `/home/jwcollie`)
3. Start services:
   - `docker compose up -d --build`
4. Open:
   - `http://localhost:8080`

## OAuth Setup (No Code Edits)

- Preferred flow: configure Google/Microsoft credentials inside the app:
  - Settings -> Calendar -> OAuth Provider Setup (Self-Hosted)
- This stores provider secrets in the database (encrypted), so users do not need source-code edits.

## Calendar Import Alternative

- Use Settings -> Calendar -> Upload Google Export to import `.zip` / `.ics` without OAuth.

## GitHub-Safe Config

- Real secrets should stay only in `.env` (ignored by git).
- Share `.env.example` for install docs and onboarding.
