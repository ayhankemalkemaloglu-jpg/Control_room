# Hermes Backend

Realtime backend for the Hermes Command Center. It ingests Telegram briefing
messages via a webhook, parses them, persists to SQLite, detects opened/closed
trades by diffing consecutive briefings, and pushes everything to clients over
Socket.io.

**Stack:** Node.js 22 · TypeScript (strict) · Express · Socket.io ·
better-sqlite3 · zod · pino.

## Endpoints

| Method | Path                 | Auth          | Description                              |
| ------ | -------------------- | ------------- | ---------------------------------------- |
| POST   | `/webhook/hermes`    | WEBHOOK_SECRET| Ingest a briefing, run trade diff, emit. |
| GET    | `/health`            | none          | Liveness, db check, last briefing, ver.  |
| GET    | `/briefings?limit=24`| AUTH_TOKEN    | Recent briefings (max 168) with symbols. |
| GET    | `/trades?status=OPEN&symbol=BTCUSDT&limit=100` | AUTH_TOKEN | Filtered trades.    |
| GET    | `/trades/stats?window=24h` | AUTH_TOKEN | Aggregate stats (`24h`/`7d`/`30d`/`all`). |

Socket.io events (handshake `auth.token` = AUTH_TOKEN): `briefing:new`,
`trade:open`, `trade:close`, `stats:update`.

## Local development

```bash
npm install
cp .env.example .env        # then edit AUTH_TOKEN / WEBHOOK_SECRET
# For local testing on a machine without /var/lib, set DB_PATH=./test.db
npm run dev                 # tsx watch, http://localhost:4000
```

Generate strong secrets:

```bash
openssl rand -hex 32
```

## VPS deploy (PM2)

```bash
git clone <repo-url> /opt/hermes-backend
cd /opt/hermes-backend          # or the hermes-backend/ subfolder of the repo
npm install

cp .env.example .env            # set AUTH_TOKEN, WEBHOOK_SECRET, CORS_ORIGINS

sudo mkdir -p /var/lib/hermes /var/log/hermes
sudo chown "$USER" /var/lib/hermes /var/log/hermes

npm run build                   # tsc -> dist/, copies schema.sql
pm2 start ecosystem.config.js
pm2 save
```

`npm run migrate` applies the schema standalone (it is also applied
automatically on startup; `CREATE ... IF NOT EXISTS` is idempotent).

## Test

```bash
curl -X POST http://localhost:4000/webhook/hermes \
  -H "Authorization: Bearer YOUR_WEBHOOK_SECRET" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "📊 Hourly Briefing — 22:00\n\n🟡 Overall: mixed | Leader: pepeusdt\n   Crypto aggr: 0.72 | Stock aggr: 0.50\n\nBy Symbol:\n  CRYPTO\n    ➡️ DOGEUSDT: range (aggr 0.73)\n    ➡️ BTCUSDT: range (aggr 0.36)\n    📉 SOLUSDT: trenddown (aggr 0.87)\n\n📌 Open Positions: 2\n   dogeusdt LONG @ 0.1032 trend_pullback\n   btcusdt LONG @ 76667.6850 range_trading"
  }'
```

Expected (first briefing — both positions open, nothing closed):

```json
{ "ok": true, "briefing_id": 1, "opened_count": 2, "closed_count": 0, "parsed": { } }
```

Send a second briefing that drops a position to see it close (exit price is
fetched from Binance; if unavailable the trade is marked `CLOSED_NO_EXIT`).
