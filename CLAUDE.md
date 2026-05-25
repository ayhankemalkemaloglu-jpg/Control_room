# Hermes Command Center — Project Memory

Crypto trading "command center": a realtime dashboard (left feed / center 3D
globe / right open positions / bottom PnL+health+clocks) fed by a Node backend
that ingests Telegram briefing webhooks, parses them, stores to SQLite, detects
trades, and pushes over Socket.io.

## Repo layout (this repo = `ayhankemalkemaloglu-jpg/control_room`)
- `hermes-command/frontend/` — Next.js 15 + React 19 + Tailwind v4 + shadcn/ui
  dashboard. Center globe is **react-globe.gl** (`PuzzleGlobe.tsx`), not cobe.
- `hermes-command/backend/` — Phase-1 MOCK backend (superseded; not the real flow).
- `hermes-backend/` — PRODUCTION backend (Express + Socket.io + better-sqlite3 +
  zod + pino): parser → SQLite → trade diff → socket broadcast.
- Active branch: `claude/busy-wright-ldtab`.

## CRITICAL caveats
- **Dual backend copies.** A SEPARATE repo `C:\Users\USER\Documents\hermes-backend`
  (deployed to the VPS via PM2) holds the same backend but is its OWN git remote —
  NOT reachable from cloud sessions (GitHub access is limited to `control_room`).
  Apply any backend change (parser regex, socket payloads, …) in BOTH `hermes-backend/`
  here AND that separate repo.
- **Branch gets force-pushed by parallel work.** Always `git fetch` and inspect
  `HEAD..origin/<branch>` and `origin/<branch>..HEAD` before pushing. NEVER force-push
  (it has overwritten commits before). Use plain `git push`; if it's rejected
  (non-fast-forward), reconcile — do not force. Don't pipe `git push` through
  `tail`/`head`: that masks the real exit code (a rejected push can look like success).

## Stack / build
- Next.js 15.3.9 (pinned; `next@latest` is 16 now). React 19. Tailwind v4
  (CSS-first `@theme inline`). shadcn set up manually (CLI hangs on a preset prompt).
- Backend: Express 4, Socket.io 4, better-sqlite3 (WAL), zod, pino. CommonJS + tsc;
  `tsx` for dev. `npm run build` = `tsc && node scripts/copy-sql.cjs` (copies
  `schema.sql` into `dist/db/` so the runtime migration can read it).
- Verify — frontend: `cd hermes-command/frontend && npx tsc --noEmit && npm run lint && npm run build`.
  Backend: `cd hermes-backend && npm run build`.

## Run locally (Windows)
- Use **cmd**, not PowerShell (PowerShell blocks `npm.ps1`; alternative:
  `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned`).
- Backend `.env`: on Windows set `DB_PATH=./hermes.db` (not `/var/lib/...`).
  Needs `AUTH_TOKEN`, `WEBHOOK_SECRET`, `CORS_ORIGINS` (include the frontend origin).
- Frontend `.env.local`: `NEXT_PUBLIC_HERMES_API_URL=http://localhost:4000`,
  `NEXT_PUBLIC_HERMES_TOKEN` = backend `AUTH_TOKEN`. NEXT_PUBLIC_* are inlined at
  dev-server start → **restart `npm run dev`** after editing. Token is browser-exposed
  (private/single-user only).
- Custom local hostname: add `127.0.0.1 hermes.local` to hosts (Notepad as admin).
  Web Speech voice needs localhost or https — blocked on plain `http://hermes.local`.

## Contract (frontend ↔ production backend)
Source of truth: `hermes-command/frontend/types/hermes.ts`. Wire format is
snake_case with UPPERCASE trade `side`.
- Socket auth: client sends `auth.token` = AUTH_TOKEN; backend rejects mismatch.
- Events:
  - `briefing:new` → `{ briefing_id, hour_label, timestamp, overall, leader, open_positions_count }`
    (light; aggr/symbols are null/[] until REST backfill).
  - `trade:open` / `trade:close` → full `Trade` row.
  - `stats:update` → frontend treats it as a "changed" ping and re-fetches `/trades/stats`.
- REST (Bearer AUTH_TOKEN): `GET /health` (open), `/briefings?limit=`,
  `/trades?status=OPEN|CLOSED&symbol=&limit=`, `/trades/stats?window=24h|7d|30d|all`.
  Ingest: `POST /webhook/hermes` (Bearer WEBHOOK_SECRET).
- Trade lifecycle: webhook diffs consecutive briefings by `position_hash`
  (md5 of `symbol|side|rawPrice|strategy`) → opens/closes. Close fetches Binance
  exit price (30s cache); on failure → `CLOSED_NO_EXIT`, pnl null.

## Known latent mismatches (resolve before building dependent UI)
- `stats:update`: backend currently emits the FULL stats object; frontend expects a
  `{ at }` ping and re-fetches anyway → harmless today.
- `Stats.GroupStat`: backend `by_symbol`/`by_strategy` rows are
  `{ symbol|strategy, count, win_rate, total_pnl }`; frontend `GroupStat` expects
  `{ key, total_trades, closed_count, win_rate, avg_pnl_pct, total_pnl_pct }`.
  Top-level `Stats` fields DO match (BottomBar uses only `total_pnl_pct`).
- Parser strategy may be bracketed `[range_trading]`; `POSITION_RE` handles both
  via `\[?(\w+)\]?`.

## Sandbox limitations (cloud sessions)
- No browser/GPU → cannot screenshot the WebGL globe; visuals must be checked on
  the user's machine.
- Binance returns 403 from sandbox IPs → trade closes here become `CLOSED_NO_EXIT`
  (works on the VPS).
