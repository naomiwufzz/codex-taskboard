[简体中文](README.zh-CN.md)

# Naomi Taskboard

> **Turn conversations into momentum.**
>
> A local-first workbench for turning Codex conversations into visible issues,
> reviewable progress, and evidence-backed outcomes.

[![License](https://img.shields.io/badge/license-Apache--2.0-2f855a.svg)](LICENSE)
[![Local first](https://img.shields.io/badge/storage-local--first-276749.svg)](PRIVACY.md)
[![Codex](https://img.shields.io/badge/built_for-Codex-4b5563.svg)](https://openai.com/codex/)

Codex is excellent at doing the work. Taskboard is for the part that happens
around the work: deciding what deserves follow-up, seeing what is currently
moving, connecting related efforts, and keeping the original conversation
close at hand without turning every chat transcript into a permanent task.

## The idea

Most AI workspaces make conversations easy to start and hard to manage after
the answer arrives. Taskboard adds a small, explicit control layer:

```text
Codex conversation
        |
        |  human chooses what matters
        v
tracked issue
        |
        |  progress, review, blockers
        v
visible project state
        |
        |  evidence-backed synthesis
        v
outcome and lineage
```

The important word is **explicit**. A session is evidence. An issue is a
commitment. An outcome is a durable result. Taskboard keeps those layers
separate so automation does not silently invent project structure.

## What it gives you

### A calm issue board

Track work through a small set of states:

- Backlog
- Todo
- In progress
- In review
- Blocked
- Done
- Canceled

Use the dashboard for orientation, the board for movement, and the list view
for scanning and bulk attention.

### Live Codex context

Issues can open or bind to Codex conversations while preserving the native
Codex route. The taskboard does not replace Codex; it gives the conversation a
place in the larger work system.

### A session shelf

The Codex session shelf is a local, read-only index of recent sessions. It lets
you:

1. Choose a session worth watching.
2. Open the original session.
3. Mark it for dashboard attention.
4. Explicitly promote it into a real issue when it deserves follow-up.

Promotion stores a compact description and a `codex://threads/<thread-id>`
evidence pointer. It does not copy the full conversation into the taskboard.

### An outcome lineage view

The Session Outcome Graph is a deliberately conservative visualization for
answering questions such as:

- What result came out of this session?
- Can one session produce more than one result?
- Which result continues another piece of work?
- Which edge is supported by an explicit handoff, and which is only a
  candidate?
- What remains unfinished?

The default view shows the mainline only. Candidate relationships are revealed
on demand instead of producing a dense graph of crossed lines.

### A CLI and a Codex Skill

The same Taskboard API is available through `naomi-taskctl`. The bundled
`manage-naomi-taskboard` Skill gives Codex a disciplined workflow for claiming,
updating, verifying, and reviewing issues without silently marking work done.

### Optional collaboration

The default mode is local. An optional Cloudflare deployment supports shared
boards for trusted collaborators while each device keeps its own local mapping
for Codex and repositories.

## Quick start

From a checkout of this repository:

```bash
npm install
npm run build
npm start
```

Open [http://127.0.0.1:47823](http://127.0.0.1:47823).

The local service keeps its working data under `.data/`. That directory is
ignored by Git and should never be committed or uploaded as part of a public
release.

For a development loop with frontend reload:

```bash
npm run dev
```

## Your first five minutes

1. Create or select a project.
2. Create one issue with a narrow, checkable outcome.
3. Move it to `In progress` only when you are actually starting it.
4. Open the issue in Codex or attach an existing Codex conversation.
5. Move it to `In review` when Codex has produced something that needs your
   judgment.
6. Mark it `Done` only after the result is accepted.

For historical work, use the session shelf instead:

```text
select session -> inspect original conversation -> promote to issue
```

That last step is intentionally manual. Selecting a session is not the same as
creating a task.

## Install the Codex Skill

The Skill is optional but recommended when you want Codex to operate on
Taskboard issues with a predictable safety boundary.

Link the Skill into your local Codex skills directory:

```bash
ln -s /absolute/path/to/naomi-taskboard/skills/manage-naomi-taskboard \
  ~/.codex/skills/manage-naomi-taskboard
```

Start a new Codex task after installing it. The Skill encourages this loop:

```text
inspect -> claim -> work -> verify -> in review -> user accepts -> done
```

It does not treat assignment alone as permission to start backlog work, and it
does not mark an issue as done without an explicit acceptance signal.

## Use `naomi-taskctl`

Create a project:

```bash
npm run naomi-taskctl -- project create \
  --id my-project \
  --name "My project" \
  --workspace-path /absolute/path/to/repository
```

Create an issue:

```bash
npm run naomi-taskctl -- issue create \
  --project my-project \
  --title "Implement the next slice" \
  --status todo \
  --priority high \
  --labels product,mvp
```

If you install the CLI with `npm link`, it can be used directly from your
shell as `naomi-taskctl`. Set `CODEX_TASKBOARD_URL` when the CLI should target another local or
trusted network service.

## Connect it to Codex

### One-command independent window

On macOS, the recommended source workflow is:

```bash
CODEX_TASKBOARD_HOST=127.0.0.1 npm run codex
```

This starts the local service when needed, launches an independent Codex
window, injects a Taskboard entry, and watches the embedded panel. Existing
Codex windows are left alone.

Keep the launcher process running while using the embedded panel. If it stops,
the browser may show `ERR_CONNECTION_REFUSED` because the local service is no
longer listening.

### Manual injection

If you already have a Codex instance launched with a debugging port:

```bash
open -n -a /Applications/ChatGPT.app --args \
  --remote-debugging-port=9231 \
  --remote-allow-origins=http://127.0.0.1:9231
```

Then inject the panel:

```bash
CODEX_TASKBOARD_HOST=127.0.0.1 \
npm run codex:inject -- --port 9231 --open
```

The injector is intentionally a resident process. Stop it with `Ctrl-C` when
you are finished.

### Desktop packaging

To develop the desktop wrapper:

```bash
npm run app:dev
```

To produce local desktop artifacts:

```bash
npm run app:build
```

The packaged application includes the local service, built panel, CLI wrapper,
Skill, and injection assets. Public desktop distribution still requires the
appropriate platform signing and release process; see:

- [Code signing policy](docs/code-signing-policy.md)
- [Windows uninstall](docs/windows-uninstall.md)
- [Privacy](PRIVACY.md)

## The session model

Taskboard intentionally avoids the phrase “import all my chats” as a default
workflow. The safer model is:

| Layer | Meaning | Default behavior |
| --- | --- | --- |
| Session | Original Codex evidence | Read-only discovery |
| Watch | A session you want nearby | Stored in browser-local state |
| Issue | Work you explicitly want to manage | Created only after promotion |
| Outcome | A result worth remembering | Separate from the issue lifecycle |
| Lineage edge | A relationship between results | Evidence-backed or clearly marked candidate |

This makes a few useful things possible without building a heavy memory
system:

- One session can yield multiple result cards.
- One result can inform more than one parent work.
- A task can remain small while the source conversation remains large.
- The original evidence remains one click away.

It also prevents a common failure mode: turning similar wording, shared
directories, or nearby timestamps into invented dependencies.

## Data and privacy

Taskboard is local-first:

- Local boards use a database on the current machine.
- Codex session discovery reads local session metadata and does not copy full
  transcripts into the board.
- The session shelf is read-only until you explicitly promote a session.
- Cloud collaboration is optional.
- The project does not include maintainer advertising or usage analytics.

Before publishing or sharing a checkout, remove or exclude:

```text
.data/
node_modules/
dist/
.playwright-cli/
*.log
```

Read the complete [Privacy policy](PRIVACY.md) before deploying a shared
instance.

## Configuration

| Variable | Purpose |
| --- | --- |
| `CODEX_TASKBOARD_HOST` | Bind address. Use `127.0.0.1` for local-only access. |
| `CODEX_TASKBOARD_PORT` | Port used by the local service. |
| `CODEX_TASKBOARD_DATA_DIR` | Location for local board data. |
| `CODEX_TASKBOARD_URL` | API origin used by `naomi-taskctl`. |

Local-only example:

```bash
CODEX_TASKBOARD_HOST=127.0.0.1 npm start
```

The default LAN mode has no account authentication. Do not expose it outside a
trusted network. For internet-facing use, deploy behind an authenticated
boundary and read [Cloud collaboration](docs/cloud-collaboration.md).

## Troubleshooting

### The browser says `ERR_CONNECTION_REFUSED`

The browser is open, but the local service is not listening. Start it again:

```bash
npm start
```

Then reload `http://127.0.0.1:47823`.

### The dashboard is empty

An empty dashboard is not an error. The board shows issues, not every Codex
conversation. Choose a session in the session shelf and explicitly promote it
when it deserves task tracking.

### A running Codex conversation is missing

Confirm that:

1. The Taskboard service is running.
2. The session belongs to the local Codex session directory.
3. The dashboard has refreshed.
4. The session is not already represented by a linked issue.

### The embedded panel disappears

The injector or launcher process may have stopped. Keep the command that
started the embedded panel running and refresh the Codex window.

### The outcome graph has no data

The graph is a read-only validation surface. It needs a local outcome draft;
it does not infer a graph from every session automatically. This is deliberate:
the graph should be empty rather than confidently wrong.

## Project map

| Path | Purpose |
| --- | --- |
| `web/` | Board, dashboard, list, session shelf, and outcome views |
| `server/` | Local HTTP API and integrations |
| `cli/` | `naomi-taskctl` command-line interface |
| `skills/manage-naomi-taskboard/` | Codex operating instructions |
| `scripts/` | Launchers, injectors, packaging, and verification |
| `cloud/` | Optional shared deployment |
| `docs/` | Operational and deployment documentation |
| `test/` | Regression and integration coverage |

## Verification

Run the full local check:

```bash
npm run check
```

Useful focused checks:

```bash
npm run typecheck
npm run build:web
node --check server/app.mjs
node --check server/project-summary.mjs
git diff --check
```

## Contributing

Small, focused contributions are welcome.

Before opening a pull request:

1. Explain the user-facing problem.
2. Keep local data and generated artifacts out of the change.
3. Add or update a regression test when behavior changes.
4. State what was verified and what remains unverified.
5. Keep automation explicit at boundaries where the system could invent
   project state.

For larger changes, open an issue first with:

- the problem in one paragraph;
- the smallest observable behavior that would solve it;
- the data and privacy implications;
- the acceptance check.

## Roadmap

The following ideas are intentionally not automatic promises:

- a review-first import preview for larger session collections;
- project selection during session promotion;
- editable, evidence-aware lineage edges;
- richer result-card extraction without copying full transcripts;
- signed desktop releases and a smoother first-run experience.

The guiding rule is simple: make the next useful state easier to see without
making the system pretend it knows more than the evidence supports.

## License

Apache-2.0. See [LICENSE](LICENSE).

For release preparation, see the [open source release checklist](docs/open-source-release.md).
