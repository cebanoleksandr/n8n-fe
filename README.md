# Flow — frontend

The web app of Flow, a workflow automation platform in the spirit of n8n:
React 19, TypeScript, Vite, MUI, TanStack Query, React Flow and CodeMirror.

## Development

The backend must be running (see `../backend`); Vite proxies `/api` and
`/socket.io` to it (`BACKEND_URL`, default `http://localhost:3000`). To use
another one, e.g. the deployed backend, copy `.env.example` to `.env` and set
`BACKEND_URL` there.

```bash
npm install
npm run dev        # http://localhost:5173
```

| Command | What it does |
|---|---|
| `npm run build` | Type-checks and builds to `dist/` |
| `npm run lint` | ESLint |
| `npm test` | Unit tests (Vitest) |
| `npm run test:watch` | Unit tests, re-run on change |
| `npm run test:e2e` | End-to-end tests (Playwright) |

## Tests

### Unit tests

Vitest, in plain Node, for the logic that has no UI: graph edits
(`components/workflow-canvas/graph.ts`), execution data, expression
autocomplete, the credential form, roles, formatting. They sit next to the code
as `*.test.ts`.

### End-to-end tests

Playwright drives Chrome through real flows in `e2e/`: sign-up and login,
connecting and disconnecting nodes, renaming with autosave, running a workflow,
activation, invitations, password and theme.

`npm run test:e2e` starts its own stand: the backend on port 3100 with the
**e2e database** (`flow_test`), Redis db 1 and the test bucket, the same ones the
backend's e2e tests use, and Vite on port 5180. Development data is never
touched. It needs:

- the backend's docker services: `docker compose up -d` in `../backend`
  (the `flow_test` database is created by the backend's `npm run test:e2e`);
- Google Chrome. Without it: `npx playwright install chromium` and
  `PW_CHANNEL=chromium npm run test:e2e`.

Each test signs up its own user, so tests run in parallel without sharing
state. A test fails on any error in the browser console (React warnings
included). After a failure, `npx playwright show-trace test-results/<test>/trace.zip`
replays it step by step.

## CI

`.github/workflows/ci.yml` runs on every push to `main` and on pull requests:

- **Lint, build, unit tests**: `npm run lint`, `npm run build` (type-checks
  the app, tests and configs), `npm test`.
- **End-to-end tests**: checks out
  [n8n-be](https://github.com/cebanoleksandr/n8n-be) next to the frontend,
  starts its Postgres, Redis and S3 with `docker compose`, creates the
  `flow_test` database and runs Playwright. Traces of failed tests are kept as
  the `playwright-traces` artifact for a week.

The e2e job tests against the backend's `main`. To try a backend branch, run
the workflow by hand (Actions → CI → Run workflow) with `backend-ref`.

## Deployment (free)

The app is static files on **GitHub Pages**; the backend runs on **Render**
(free web service + free Key Value for Redis) with **Neon** Postgres and an
S3-compatible bucket (**Backblaze B2**, 10 GB free).

```
https://<user>.github.io/n8n-fe/  ──HTTPS + WebSocket──►  https://flow-api.onrender.com
       GitHub Pages                                       Render: API + worker (APP_ROLE=all)
                                                           ├─ Redis: Render Key Value
                                                           ├─ Postgres: Neon
                                                           └─ files: Backblaze B2
```

The two are different sites, so the backend runs with `COOKIE_SAME_SITE=none`:
the refresh cookie is sent cross-site as `Secure; Partitioned; SameSite=None`,
and the frontend calls the API (and its socket.io) by absolute URL
(`VITE_API_URL`).

### 1. Storage and database

1. **Neon** (neon.tech): create a project in AWS Frankfurt (`eu-central-1`).
   Copy the connection string with **connection pooling off** (the host
   without `-pooler`); it ends with `?sslmode=require`.
2. **Backblaze B2**: create a private bucket, e.g. `flow-binary-data-<you>`
   (names are global), and an application key limited to it. Note the
   bucket's S3 endpoint, e.g. `https://s3.eu-central-003.backblazeb2.com`; its
   region is the part after `s3.` (`eu-central-003`).

### 2. Backend on Render

1. Render Dashboard → **New → Blueprint** → the `n8n-be` repository. It reads
   `render.yaml`: the `flow-api` web service and the `flow-redis` Key Value.
2. Fill in the values it asks for:

   | Variable | Value |
   |---|---|
   | `DATABASE_URL` | the Neon connection string |
   | `ENCRYPTION_KEY` | `openssl rand -base64 32`. **Keep a copy**: without it stored credentials can't be read |
   | `PUBLIC_URL` | `https://flow-api.onrender.com` (the service's URL; webhook and OAuth2 URLs use it) |
   | `CORS_ORIGINS` | `https://<user>.github.io` (an origin, no path) |
   | `S3_ENDPOINT`, `S3_REGION`, `S3_BUCKET` | from B2 |
   | `S3_ACCESS_KEY`, `S3_SECRET_KEY` | the B2 key ID and application key |

3. After the deploy, `https://flow-api.onrender.com/api/health/ready` should
   report `database`, `redis` and `storage` as `ok`.

Each push to `main` of `n8n-be` redeploys it.

### 3. Frontend on GitHub Pages

1. Repository **Settings → Pages → Source: GitHub Actions**.
2. **Settings → Secrets and variables → Actions → Variables**: add `API_URL`
   = `https://flow-api.onrender.com/api`.
3. Push to `main`. `.github/workflows/deploy.yml` builds and publishes after
   CI passes (or run it by hand: Actions → Deploy to GitHub Pages).

The app is served under `/<repo>/` (Vite `base`, from `BASE_PATH`). Pages has
no rewrites, so `404.html` is a copy of the app and deep links still work.
With a custom domain, set the variable `BASE_PATH` to `/`.

### Free plan limits

- **Render sleeps** after 15 minutes without requests; the next one waits
  about a minute. While asleep, **Schedule triggers don't fire** and the first
  webhook call may time out. To keep it awake, have a free monitor (e.g.
  UptimeRobot, every 5 minutes) call `https://flow-api.onrender.com/api/health`.
  One service running all month fits in Render's 750 free hours.
- **512 MB of memory**: API and worker share one process (`APP_ROLE=all`,
  `WORKER_CONCURRENCY=2`).
- **Key Value is not persisted**: a restart drops queued runs. Active
  schedules are restored from Postgres on startup.
- **Neon** free: 0.5 GB; finished executions are deleted after 14 days
  (`EXECUTIONS_MAX_AGE_DAYS`).
- **Safari** blocks cookies of other sites more strictly than Chrome and
  Firefox. If a reload signs you out there, put the frontend and the API on
  one domain of your own (`app.` and `api.` subdomains, `COOKIE_SAME_SITE=lax`).
