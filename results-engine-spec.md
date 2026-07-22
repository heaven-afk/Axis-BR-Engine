# CODM BR Results Engine — Build Spec

## 1. What this is

A multi-tenant, web-based results engine for Call of Duty Mobile Battle Royale
esports — effectively replacing two Excel workbooks (player stats + team
stats) with a real app. Analysts create tournaments inside workspaces, enter
per-match results, and the app computes standings/leaderboards using a
scoring system they define per tournament (not fixed).

Before writing code: **ask the user about existing schema conventions,
component structure, and styling conventions already in the codebase** if
this is being added to an existing project, rather than assuming a fresh
scaffold.

---

## 2. Auth & workspaces

- **Auth**: Clerk. Use Clerk orgs to back workspaces if that fits the org
  model cleanly; otherwise a custom `workspace_members` table keyed to
  Clerk user IDs is fine — pick whichever needs less custom-permission
  plumbing and note the tradeoff.
- **Personal workspace**: every user gets one automatically on first sign-in.
- **Team workspace**: a user can create additional workspaces and invite
  others by email/invite link.
- **Roles within a (team) workspace**:
  - **Owner** — the creator; full control, can manage members and billing/settings if any.
  - **Analyst** — invited collaborator; can create/edit tournaments, enter
    match data, edit scoring config.
  - **Observer** — invited collaborator; **read-only** across the whole
    workspace, including in-progress/unpublished results (there's no
    separate "draft vs published" visibility tier — keep this simple unless
    the user asks for it later).
- A user can belong to multiple workspaces and switch between them (workspace
  switcher in the nav, like Slack/Linear/Vercel).
- Tournaments are **siloed per workspace** — no cross-workspace data sharing
  or shared player pools for v1.

---

## 3. Core data model

Names are suggestions — align to existing schema conventions if there are any.

```
workspaces
  id, name, type (personal | team), owner_user_id, created_at

workspace_members
  id, workspace_id, user_id, role (owner | analyst | observer), invited_by, joined_at

tournaments
  id, workspace_id, name, game_mode (solo | duo | squad), format (player | team | both),
  num_days, lobbies_per_day, created_by, created_at

-- SCORING CONFIG (per tournament, fully custom — see §4)
scoring_configs
  id, tournament_id,
  points_per_kill (numeric),
  placement_points jsonb   -- e.g. {"1": 25, "2": 20, "3": 15, ..., "25": 0}

-- ROSTER
teams
  id, tournament_id, team_name, clan_name, tier, slot_number

players
  id, tournament_id, team_id (nullable for free agents),
  professional_name, in_game_name, gender, region, country, device, device_model, slot_number

-- MATCH RESULTS (one row per team per lobby per day; player kills roll up from here or a linked table)
match_results
  id, tournament_id, team_id, day_number, lobby_number,
  placement (int), kills (int), bonus_add (int), bonus_minus (int)

player_match_stats
  id, tournament_id, player_id, day_number, lobby_number,
  kills (int), damage (int), accuracy (numeric)
```

**Computed, not stored** (recompute on read or via a materialized view —
don't duplicate the Excel's "bake the formula result into a cell" pattern):

- Per team per day: matches played, placement points, kill points, bonus,
  total points, wins (1st-place finishes), avg placement.
- Per team, tournament-to-date: sum of the above across all days, plus rank
  (sorted by total points, tie-break on total kills).
- Per player per day: total kills across lobbies, avg damage, avg accuracy.
- Per player, tournament-to-date: total kills, avg damage, avg accuracy,
  kills/match, kills/event.

This mirrors `DAY 1-6` → `COLLATION` → `TEAM RANKING` in the team template,
and `DAY 1-6` → `SET 1/2 PLAYERS` → `COMBINED` in the player template —
minus the advanced analytics tab (momentum index, consistency score,
composite Team Rating are explicitly **out of scope**, see §6).

---

## 4. Scoring engine (fully custom per tournament)

- When an analyst creates a tournament, they define:
  - **Placement → points table**: editable rows for as many placements as
    the lobby size needs (the Excel goes 1–25; make the row count
    configurable, not hardcoded to 25). Placements outside the table (DNF,
    no data) contribute 0.
  - **Points per kill**: single numeric multiplier.
  - Optional bonus points (add/subtract) per team per lobby, matching the
    Excel's `BONUS POINTS (Add/Minus)` columns — keep this as a manual
    entry field, not derived.
- A tournament's scoring config can be edited after creation, but changing
  it should **recompute all existing standings live** — don't require
  re-entering match data.
- Provide a sensible default table on tournament creation (mirror the
  Excel's default: 1st=25, 2nd=20, 3rd=15, 4th=10, 5th=5, 6th+=0) that the
  analyst can fully overwrite — this is a starting point, not a preset
  system to choose between.

---

## 5. Data entry

- Manual entry forms per day/lobby for team placement + kills, and per
  player for kills/damage/accuracy — these map directly to the `DAY N`
  sheets' input columns.
- [[br-stat-platform]] already has a scoped OCR screenshot parser (Groq
  vision API) for scoreboard entry — this results engine should be built so
  that feature can feed `match_results` / `player_match_stats` directly once
  it exists, but manual entry is the v1 requirement.
- Observers never see entry forms (read-only enforced server-side, not just
  hidden in the UI).

---

## 6. Explicitly out of scope for this build

- Momentum index, consistency score, composite "Team Rating," and all other
  normalized/weighted analytics from the `COLLATION` / `TEAM ANALYTICS`
  sheets. Standings = points + kills + placement, nothing derived beyond
  that.
- Cross-workspace player pools / shared rosters.
- Draft vs. published visibility tiers for Observers.

---

## 7. UI direction

The user wants this "top notch" — treat this as a data-dense product (think
Liquipedia leaderboard meets a modern SaaS dashboard), not a spreadsheet
clone. Concretely:

- Workspace switcher + tournament switcher in a persistent nav.
- Live-updating leaderboard tables (sortable, sticky header, rank change
  indicators if easy to add).
- A clean tournament dashboard: standings table front and center, with day-
  by-day breakdown as a secondary/expandable view rather than 6 separate tabs.
- Role-aware UI: Observers should visually understand they're read-only
  (not just have buttons silently disabled).
- Mobile-first is a known priority for this product — [[br-stat-platform]]
  already has a scoped glassmorphic bottom nav component; reuse that
  pattern/aesthetic here rather than introducing a new visual language.
- Before implementing: check the frontend-design conventions already in use
  in this codebase (design tokens, component library) rather than
  introducing new ones.

---

## 8. Questions the coding agent should ask before starting

1. Is this being added to the existing BR stat tracking platform codebase,
   or a new project? (Affects whether Clerk/DB/schema already exist.)
2. Existing ORM/DB choice already in use (Prisma? Drizzle? raw SQL?) —
   match it rather than introducing a new one.
3. Existing component library / design tokens, if any, to match for the
   "top notch" UI bar.
4. Whether duo/squad team sizes need per-player-in-team display within the
   team results view, or team-level aggregates are sufficient for v1.
