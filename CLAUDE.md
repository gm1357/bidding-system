# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development
npm run dev           # Start Next.js dev server (port 3000)
npm run build         # Build for production
npm run start         # Start production server

# Testing
npm run test                  # Run integration tests (requires dev server + seeded DB)
npm run test:watch            # Jest in watch mode
npm run test:ci-integration   # Full CI flow: reset DB, seed, start Next.js, run Jest

# Linting & formatting
npm run lint:check    # ESLint check
npm run lint:fix      # ESLint auto-fix
npm run format:check  # Prettier check
npm run format:fix    # Prettier auto-fix

# Database
docker compose up -d              # Start local PostgreSQL (port 5432)
npm run prisma:migrate            # Apply migrations (dev)
npm run prisma:generate           # Regenerate Prisma client
npm run prisma:seed               # Seed 100 fake Collections
npm run prisma:studio             # Open Prisma Studio on port 5555
npm run prisma:reset              # Reset DB and re-run all migrations

# Commits (uses commitizen + conventional commits)
npm run commit        # Interactive conventional commit prompt
```

## Environment

Copy `.env.example` to `.env`. The only required variable is `DATABASE_URL` pointing to the local PostgreSQL instance started via `docker compose`.

Node version is pinned in `.nvmrc` (`lts/krypton`).

## Architecture

**Next.js 16 App Router** with TypeScript, React 19, and Tailwind CSS v4.

```
app/
  layout.tsx              # Root layout (Geist font, global metadata)
  page.tsx                # Home page ('use client' — manages all UI state)
  components/
    Header.tsx            # User selector + "Create Collection" button
    CollectionList.tsx    # Infinite-scroll list, delegates to CollectionRow
    CollectionRow.tsx     # Single collection card with bid actions
    BidRow.tsx            # Single bid row with accept/reject controls
    CreateCollectionModal.tsx
    PlaceBidModal.tsx
  api/
    status/route.ts                   # GET /api/status — health check used by tests
    collections/
      route.ts                        # GET /api/collections, POST /api/collections
      [id]/
        route.ts                      # PATCH /api/collections/:id, DELETE /api/collections/:id
        bid/route.ts                  # POST /api/collections/:id/bid
    bids/[id]/
      route.ts                        # GET /api/bids/:id, PATCH /api/bids/:id, DELETE /api/bids/:id
      accept/route.ts                 # POST /api/bids/:id/accept
      reject/route.ts                 # POST /api/bids/:id/reject
    users/route.ts                    # GET /api/users

lib/
  prisma.ts               # Singleton PrismaClient (PrismaPg adapter, cached on globalThis in dev)
  types.ts                # Shared TypeScript types (PaginatedResponse<T>, CollectionWithBids, body interfaces)

tests/
  test-helpers.ts         # waitForServer() — polls /api/status before test suites run
  integration/api/        # Integration tests that hit the live dev server at localhost:3000

prisma/
  schema.prisma           # DB schema (output → ./generated/prisma)
  seed.ts                 # Seeds fake records via faker
  migrations/             # SQL migration history
  generated/prisma/       # Auto-generated Prisma client — never edit manually
```

### Testing approach

Tests are **integration tests** that run against the live Next.js dev server — there are no unit tests. The full flow is:

1. `npm run dev` starts the server
2. `waitForServer()` polls `GET /api/status` with retries until it responds
3. Jest test suites run fetch calls against `http://localhost:3000`

To run tests locally: start the server (`npm run dev`), ensure the DB is seeded (`npm run prisma:seed`), then run `npm test`. In CI, `test:ci-integration` handles all of this atomically.

### Database layer

- **PostgreSQL** via Docker Compose for local dev.
- **Prisma** with the `@prisma/adapter-pg` driver adapter (no native bindings).
- Generated client lives at `prisma/generated/prisma/` (non-standard output path). Import it as:
  ```ts
  import { PrismaClient } from '../prisma/generated/prisma/client';
  ```
- `lib/prisma.ts` exports a singleton for use inside Next.js API routes and Server Components.
- `prisma generate` runs automatically on `npm install` via `postinstall`.

### Current data model

| Model        | Key fields                                                                                                          |
|--------------|---------------------------------------------------------------------------------------------------------------------|
| `Collection` | `id` (UUID), `name`, `description`, `stock`, `price` (int cents), `createdAt`, `updatedAt`, `deletedAt?`           |
| `User`       | `id` (UUID), `name`, `email` (unique), `createdAt`, `updatedAt`, `deletedAt?`                                      |
| `Bid`        | `id` (UUID), `collectionId`, `userId`, `price` (int cents), `status` (`PENDING`\|`ACCEPTED`\|`REJECTED`), `createdAt`, `updatedAt`, `deletedAt?` |

Soft-deletes are supported via `deletedAt` (nullable) on all models.

### Bid lifecycle

- Bids are created via `POST /api/collections/:id/bid` with `{ userId, price }` and start as `PENDING`.
- Only `PENDING` bids can be updated (price only) or soft-deleted.
- `POST /api/bids/:id/accept` runs a transaction: sets the bid to `ACCEPTED` and auto-rejects all other `PENDING` bids on the same collection.
- `POST /api/bids/:id/reject` sets the bid to `REJECTED`; cannot reject an already-accepted bid.

### Pagination

All list endpoints return `PaginatedResponse<T>` from `lib/types.ts`:

```ts
{ data: T[], page: number, pageSize: number, total: number, totalPages: number }
```

Params `page` (default 1, min 1) and `pageSize` (default 10, clamped to `[1, 100]`) are read from URL search params via `NextRequest.nextUrl.searchParams`.

## Git conventions

Commits follow **Conventional Commits** enforced by `commitlint` + `husky`:
- Allowed types: `feat`, `fix`, `chore`, `ci`, `docs`, `refactor`, `test`, `perf`, `style`, `revert`
- Pre-commit hook runs: `lint:check`, `format:check`, `prisma:format`, `prisma:validate`
- Use `npm run commit` to get the interactive prompt instead of writing the message by hand.

## CI

On every pull request, GitHub Actions runs:
- **Linting**: Prettier, ESLint, Commitlint (`linting.yaml`)
- **Prisma**: schema validation — `prisma validate` (`prisma.yaml`)
- **Tests**: starts Docker PostgreSQL, runs `test:ci-integration` (`test.yaml`)
