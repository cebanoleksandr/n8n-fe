# Flow — frontend

The web app of Flow, a workflow automation platform in the spirit of n8n:
React 19, TypeScript, Vite, MUI, TanStack Query, React Flow and CodeMirror.

## Development

The backend must be running (see `../backend`); Vite proxies `/api` and
`/socket.io` to it (`BACKEND_URL`, default `http://localhost:3000`).

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
