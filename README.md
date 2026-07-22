# CODM BR Results Engine

Fresh Next.js app scaffold for the CODM Battle Royale results engine described in
`results-engine-spec.md`.

## What is included

- Data-dense tournament dashboard with workspace and tournament switchers.
- Team standings computed from raw match rows.
- Player leaderboard computed from raw player match stats.
- Editable-looking scoring table and manual-entry surface, with observer read-only behavior.
- Prisma/Postgres schema for workspaces, workspace members, tournaments, scoring config, rosters, match results, and player stats.

## Auth and workspace choice

This scaffold uses Clerk user IDs with a custom `workspace_members` table rather
than Clerk Organizations as the primary permission model. That keeps the product's
three roles (`owner`, `analyst`, `observer`) close to the tournament data and makes
server-side role checks straightforward. Clerk can still handle identity, sessions,
and invitations.

## Environment

Create `.env.local` with:

```bash
DATABASE_URL="postgresql://..."
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_..."
CLERK_SECRET_KEY="sk_..."
```

The current UI uses sample data while the database and Clerk session plumbing are
connected.
