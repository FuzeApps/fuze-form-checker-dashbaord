# Fuze Form Analysis — Dashboard

React + TypeScript + Vite dashboard for the Fuze Form Analysis platform.

## Deployment

**Vercel handles deployment automatically** via Git integration — no GitHub Actions needed.

### Setup

1. Connect this repo to a Vercel project.
2. Set the following environment variable in Vercel project settings:

```
VITE_API_BASE_URL=https://api.yourdomain.com
```

3. Push to `main` — Vercel auto-deploys.

## Local Development

```bash
npm install
cp .env.example .env.local
# Edit .env.local to point to your local or staging API
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

## Environment Variables

| Variable | Description |
|---|---|
| `VITE_API_BASE_URL` | Base URL of the `api-service` (e.g. `https://api.yourdomain.com`) |

## Pages

### Tenant Dashboard
- `/` — Overview with stats and daily chart
- `/analyses` — Paginated analysis list with filters
- `/analyses/:id` — Analysis detail: video player, score ring, category bars, timeline, issues
- `/api-keys` — API key management
- `/webhook` — Webhook configuration
- `/usage` — Usage charts and billing units
- `/audit-logs` — Audit trail

### Admin Dashboard
- `/admin/tenants` — Tenant management
- `/admin/tenants/:id` — Tenant detail + quota controls
- `/admin/apps` — All registered apps
- `/admin/analyses` — Cross-tenant session browser
- `/admin/usage` — Platform-wide usage
- `/admin/failed-jobs` — Failed jobs with retry
- `/admin/webhook-events` — Webhook delivery log
- `/admin/dlq` — SQS Dead Letter Queue inspection
- `/admin/audit-logs` — Platform audit log
