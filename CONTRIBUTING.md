# Contributing to Naomi Taskboard

Thanks for helping make AI-assisted work easier to understand and safer to
manage.

Naomi Taskboard is intentionally opinionated about a few boundaries:

- a conversation is not automatically a task;
- a task is not automatically completed;
- a relationship is not automatically evidence-backed;
- local data should remain local unless the user deliberately configures
  collaboration.

Good contributions preserve those boundaries while making real work easier to
see and move forward.

## Before you start

For a small bug fix or documentation correction, open a focused pull request.

For a new workflow, integration, or data model, open an issue first. Describe:

1. The user problem in plain language.
2. The smallest observable behavior that would solve it.
3. What data the feature reads or writes.
4. What must remain an explicit user decision.
5. How someone can verify that it works.

This keeps useful ideas from turning into large, untestable product layers.

## Development loop

Install dependencies and run the local development loop:

```bash
npm install
npm run dev
```

For a production-style local run:

```bash
npm run build
npm start
```

Read the relevant code path before changing behavior. A few common entry
points:

| Area | Start here |
| --- | --- |
| Board, dashboard, list, and issue UI | `web/src/` |
| Local HTTP API and SQLite behavior | `server/` |
| Codex launcher and injection | `scripts/codex-injector.mjs` |
| CLI commands | `cli/naomi-taskctl.mjs` |
| Codex operating policy | `skills/manage-naomi-taskboard/` |
| Optional shared deployment | `cloud/` |

## Pull request checklist

Before opening a pull request:

1. Keep the change focused on one user-facing problem.
2. Do not commit `.data/`, local databases, attachments, logs, browser state,
   API keys, or session transcripts.
3. Add or update tests for behavior changes whenever practical.
4. Run the smallest relevant checks, then state exactly what you ran.
5. State any remaining gaps instead of implying they were tested.
6. Include screenshots for visible UI changes when they help review.
7. Update the README or docs when a user workflow changes.

At minimum, run:

```bash
npm run typecheck
npm run build:web
git diff --check
```

Run the full suite before larger changes:

```bash
npm run check
```

## Design principles

### Prefer explicit promotion over automatic import

Session discovery is useful. Automatically turning every conversation into an
issue is not. A feature should make the transition from evidence to commitment
clear and reversible.

### Keep evidence visible

When Taskboard summarizes, links, or relates work, users should be able to
find the original issue, session, comment, or artifact that supports it.

### Do not manufacture lineage

Shared wording, a shared directory, or nearby timestamps are not proof that
two work items depend on each other. Candidate relationships must remain
visibly tentative until confirmed.

### Treat local data as product data

Taskboard may point at repositories, worktrees, Codex sessions, and local
databases. Do not add telemetry, remote upload, or broad filesystem scanning
without a clear user-facing reason and a documented consent boundary.

## Reporting bugs

A useful bug report contains:

- what you expected;
- what happened instead;
- the smallest reproducible path;
- whether the browser-only, embedded, desktop, or CLI path was involved;
- relevant redacted logs or screenshots;
- whether local data or an existing task was affected.

Please remove task content, session text, local paths, secrets, and personal
data from public reports.

## Code of collaboration

Assume good intent, be specific about observable behavior, and prefer
reproducible evidence over confidence or volume. The goal is not merely to add
features; it is to make AI-assisted work more legible and more trustworthy.
