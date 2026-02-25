# Bidding System

A full-stack bidding platform where users can browse item collections, place bids, and have bids accepted or rejected. When a bid is accepted, all other pending bids on the same collection are automatically rejected.

## Product overview

Collections represent items available for bidding. Each collection has a name, description, stock quantity, and a starting price (stored in cents). Any user can place a `PENDING` bid on a collection. A collection owner can accept one bid — which atomically rejects all remaining pending bids — or reject bids individually.

## Tech stack

- **Next.js 16** (App Router) + **TypeScript** + **React 19**
- **Tailwind CSS v4** for styling
- **PostgreSQL** (via Docker Compose) + **Prisma** ORM with `@prisma/adapter-pg`

## Project structure

```
app/
  page.tsx                # Single-page client app (user selector, collection list)
  components/             # Header, CollectionList, CollectionRow, BidRow, modals
  api/
    collections/          # GET /api/collections, POST /api/collections
      [id]/route.ts       # PATCH, DELETE /api/collections/:id
      [id]/bid/route.ts   # POST /api/collections/:id/bid
    bids/[id]/            # GET, PATCH, DELETE /api/bids/:id
      accept/route.ts     # POST — accepts bid, auto-rejects others
      reject/route.ts     # POST — rejects a single bid
    users/route.ts        # GET /api/users
    status/route.ts       # GET /api/status (health check)

lib/
  prisma.ts               # Singleton PrismaClient
  types.ts                # Shared types: PaginatedResponse<T>, request body interfaces

tests/
  integration/api/        # Jest integration tests against the live dev server
```

All list endpoints return a paginated envelope `{ data, page, pageSize, total, totalPages }`. Soft-deletes are used throughout (`deletedAt` on every model).

## Running locally

**Prerequisites:** Node.js (see `.nvmrc` for the pinned version), Docker.

```bash
# 1. Start the database
docker compose up -d

# 2. Install dependencies and generate the Prisma client
npm install

# 3. Configure environment
cp .env.example .env   # Only DATABASE_URL is required

# 4. Apply migrations and seed 100 fake collections
npm run prisma:migrate
npm run prisma:seed

# 5. Start the dev server
npm run dev            # http://localhost:3000
```

## Running tests

Tests are integration tests that run fetch calls against the live dev server — there are no unit tests.

```bash
# With the dev server already running and DB seeded:
npm test

# Or let the CI script handle everything (reset DB, seed, start server, run tests):
npm run test:ci-integration
```

To run a single test file:

```bash
npx jest tests/integration/api/bids/accept.test.ts --runInBand
```

## Linting and formatting

```bash
npm run lint:check
npm run format:check

npm run lint:fix
npm run format:fix
```

Commits use Conventional Commits (enforced by `commitlint` + `husky`). Use `npm run commit` for the interactive prompt.

---

## Engineering questions

### How would you monitor the application to ensure it is running smoothly?

The existing `GET /api/status` health-check endpoint is the natural starting point — it should be wired into an uptime monitor (e.g. Datadog Synthetics, Better Uptime, or a simple cron-based ping) so on-call is alerted within seconds of the process going down.

Beyond uptime, the key signals to capture:

- **Error rate and latency by route** — instrument each API route (or a shared middleware wrapper) to emit request duration and HTTP status. A sudden spike in 5xx responses or p99 latency on `/api/bids/:id/accept` (which runs a DB transaction) is the most likely early warning of a problem.
- **Database health** — track query duration, connection pool saturation, and deadlock frequency. The accept/reject transaction is the hottest path and the one most likely to degrade under load.
- **Structured logging** — replace bare `console.log` calls with a structured logger and ship logs to a centralised store (CloudWatch Logs, Datadog, Loki). Correlate logs with a request ID injected in middleware so a failing bid can be traced end-to-end.
- **More test coverage** — add more test coverage, especiallly for the missing FE tests, to ensure the application is running smoothly and catch regressions early.

### How would you address scalability and performance?

**Database**

- Think about adding indexes, for example: an index on `(collectionId, status, deletedAt)` for the bid queries that filter by collection and status, this would avoid the accept transaction to do a full table scan for pending bids today and for a large dataset this would be a bottleneck.
- For read-heavy list pages, a read replica for `GET /api/collections` would offload the primary immediately.

**API layer**

- The `GET /api/collections` response is fully recomputed on every request. A cache would dramatically reduce DB load for a busy browse page.
- Horizontal scaling (multiple Next.js instances behind a load balancer) works as-is because all state lives in Postgres, but the Prisma connection pool size should be tuned per instance to avoid exhausting database connections.

**Frontend**

- The homepage loads all collections client-side with infinite scroll; adding a server-rendered first page would improve initial paint and make the page indexable.
- API responses could benefit from `stale-while-revalidate` HTTP cache headers, letting the browser serve a cached response instantly while fetching a fresh one in the background.

### Trade-offs and things I would do differently with more time

**Authentication and authorization** — There is no auth layer. Users are selected from a dropdown rather than logged in, which means anyone can accept or reject any bid. In a real product this would be the first thing to add: a session-based or JWT auth layer, row-level checks to ensure only the collection creator can accept/reject bids, and protection against a user bidding on their own collection.

**Frontend componentization** — The main page component manages all data-fetching state (users, collections, pagination, modal visibility) in a single `useState`/`useCallback` file. This grows unwieldy quickly. I would extract data-fetching into custom hooks (`useCollections`, `useBidActions`) and consider a lightweight server-state library (React Query / SWR) to handle caching, background re-fetching, and loading/error states consistently across components.

**Frontend integration tests** — Tests only cover the API layer. There are no browser-level tests (Playwright, Cypress) verifying that the UI renders correctly, that placing a bid updates the list, or that the accept/reject buttons behave as expected. These are the tests most likely to catch regressions as the UI evolves.

**Backend error handling** — Route handlers validate required fields but return generic `{ error: string }` responses with no machine-readable code. Callers cannot distinguish "collection not found" from "bid already accepted" without parsing the message string. A consistent error schema (`{ code, message }`) would make the API much easier to integrate against.

**Input validation library** — Body validation is done with hand-written `if` checks in each route, for the simplicity of the project right now, this is fine, but in a real project, as it grows larger, I would use a schema library (Zod) to reduce boilerplate, give free TypeScript inference, and produce consistent, detailed validation error messages.
