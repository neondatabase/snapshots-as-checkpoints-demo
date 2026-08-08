![Snapshots as Checkpoints](./assets/home.png)

### Live demo

- https://snapshots-as-checkpoints-demo.vercel.app/

### What is this?

Snapshots as Checkpoints is a demo that showcases how to build a “checkpoint” abstraction for agent/codegen workflows using Neon’s snapshot and restore APIs. Each agent prompt produces a new checkpoint. You can jump back and forth between checkpoints to instantly revert schema and data.

This demo uses one persistent meta Postgres database and a dynamic app database per user session:

- meta database: runs Neon Auth (Managed Better Auth), which owns the `neon_auth` schema, and stores `projects` and `checkpoints` (managed by Drizzle)
- app database: created per user as a Neon project at demo start; its URL is saved in the `projects` table and used for all contacts reads/writes

Key docs in this repo:

- [BRANCHING_DOCS.md](BRANCHING_DOCS.md): creating, listing, and deleting branches with the Neon API
- [SNAPSHOT_DOCS.md](SNAPSHOT_DOCS.md): creating and restoring snapshots (one-step and multi-step)
- [OPERATIONS_DOCS.md](OPERATIONS_DOCS.md): Neon control-plane operations and polling semantics

## How it works

Minimal checkpoint implementation using snapshots:

1. v1 prompt: “Create a contact list app … name + email” → app + DB created → snapshot s1

2. v2 prompt: “Add role and company” → schema + app updated → snapshot s2

3. v3 prompt: “Add tags” → schema + app updated → snapshot s3

Reverting is restoring a snapshot:

- revert to v1 → restore s1
- revert to v3 → restore s3

### App flow

- Home page → Start demo: creates (or recreates) a Neon project for the signed-in user, stores it in the meta DB, applies the v1 mutation to that app DB, snapshots, and creates the first checkpoint
- Checkpoint page `/[checkpointId]`:
  - Top: timeline of checkpoints with jump actions
  - Tabs: app | meta db | contacts schema
    - app: interactive contacts table (v1/v2/v3 components)
    - meta db: `checkpoints` table from the meta database
    - contacts schema: columns reported by `information_schema.columns` (from the app database)
  - Actions: revert (apply snapshot), create/jump to next
  - Next prompt: shows what the next mutation will do

### Data fetching

Checkpoint page fetches data in parallel with Promise.all:

- contacts for the current version (using the app DB URL from the current project)
- contacts table schema (from the app DB's `information_schema`)
- meta `checkpoints` rows (from the meta DB)

### Applying a snapshot and waiting for operations

- `lib/neon/apply-snapshot.ts` calls Neon’s restore endpoint with `finalize_restore: true` and a `target_branch_id` (production branch), then collects operation IDs from the response
- `lib/neon/operations.ts` polls each operation using the operations API until it reaches a terminal status (`finished`, `skipped`, or `cancelled`)

See [OPERATIONS_DOCS.md](OPERATIONS_DOCS.md) for operation semantics, and [SNAPSHOT_DOCS.md](SNAPSHOT_DOCS.md) for the restore flow.

## Environment variables

Create a `.env` file in the project root. See [.env.example](.env.example).

```env
# Meta database (Drizzle-managed: projects, checkpoints)
DATABASE_URL=postgres://user:pass@host/meta_db

# Neon Auth (Managed Better Auth) on the meta database's branch
NEON_AUTH_BASE_URL=https://ep-xxx.neonauth.us-east-2.aws.neon.tech/neondb/auth
NEON_AUTH_COOKIE_SECRET=at-least-32-characters

# Neon API access for creating/deleting projects, snapshots, restores.
# The key must be scoped to NEON_ORG_ID.
NEON_API_KEY=your_org_api_key
NEON_ORG_ID=org-...
```

Notes:

- `DATABASE_URL` points to the meta database only. The app database URL is created dynamically per user and stored in the `projects` table.
- Every demo user gets their own Neon project in `NEON_ORG_ID`. The app rejects a project that comes back in any other org, so a key scoped elsewhere fails loudly instead of filling the wrong org.
- The app uses the `production` branch of each user's Neon project as the root branch for snapshots/restores.

## Run locally

Node.js 20.9 or newer is required (Next.js 16).

```bash
npm install
```

Neon Auth has to be running on the meta database's branch before the app can sign anyone in:

```bash
neon neon-auth enable --project-id <meta-project-id>
neon neon-auth status --project-id <meta-project-id>   # prints NEON_AUTH_BASE_URL
```

`openssl rand -base64 32` generates `NEON_AUTH_COOKIE_SECRET`. Then apply the schema and start the app:

```bash
npm run db:migrate
npm run dev
```

Open http://localhost:3000 and click “Start demo”. The app will:

- create (or recreate) a Neon project for the signed-in user and store it in the meta DB
- run the v1 mutation against that app DB and create the initial snapshot
- navigate to the first checkpoint route

## Files of interest

- app/[checkpointId]/page.tsx: main page, tabs, actions, and parallel fetching
- lib/contacts.ts: schema mutations, CRUD, and contacts/schema queries
- lib/checkpoints.ts: meta DB `checkpoints` table and list/create/update
- lib/neon/branches.ts: resolves the `production` branch id for a given Neon project
- lib/neon/create-snapshot.ts: creates a snapshot on the production branch for a given Neon project
- lib/neon/apply-snapshot.ts: restore + wait for operations to finish for a given Neon project
- lib/neon/operations.ts: polls operation ids until terminal status for a given Neon project

## Production deployment

Deploy with your platform of choice (e.g., Vercel). Provide the same environment variables in your deployment environment.
