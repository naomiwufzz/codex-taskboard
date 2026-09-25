# Open Source Release Checklist

Use this checklist before publishing a source archive, creating a public
repository, or attaching a release asset.

## Source boundary

- [ ] Confirm `.data/` is absent. It may contain the local database, runtime
  endpoint, attachments, and outcome drafts.
- [ ] Confirm `.codex/`, `AGENTS.md`, private review notes, and local browser
  evidence are absent unless they have been rewritten for public distribution.
- [ ] Confirm `node_modules/`, `dist/`, logs, browser artifacts, and local
  cloud state are absent.
- [ ] Confirm no screenshot, fixture, or document contains real task text,
  personal names, local paths, private links, credentials, or session content.
- [ ] Confirm `.env` files, deployment credentials, and signing material are
  absent.
- [ ] Keep `LICENSE`, `NOTICE`, and all bundled third-party license notices.

## Repository readiness

- [ ] Read `README.md` from the perspective of someone who has never used
  Naomi Taskboard.
- [ ] Keep `README.zh-CN.md`, `CONTRIBUTING.md`, `SECURITY.md`, and
  `PRIVACY.md` in sync with the public workflow.
- [ ] Update repository links, issue templates, release links, and ownership
  references after choosing the public repository location.
- [ ] Preserve the existing Apache-2.0 license and the repository provenance
  when publishing a customized distribution.
- [ ] Keep automatic updates disabled until a Naomi repository, release
  endpoint, and updater signing key have been deliberately created.
- [ ] Choose a clear repository description and a small set of accurate topics
  rather than claiming unverified capabilities.

## Verification

- [ ] Run `npm run typecheck`.
- [ ] Run `npm run build:web`.
- [ ] Run `npm run check` before a release when time permits.
- [ ] Run `git diff --check`.
- [ ] Start a fresh local instance and confirm the quick-start path works.
- [ ] Open the embedded Codex path only after reviewing the local CDP warning
  in the README.

## Release assets

- [ ] Source archives should contain source, docs, tests, and lockfiles.
- [ ] Do not label an unsigned desktop artifact as a stable release.
- [ ] Publish a checksum for each binary artifact.
- [ ] Follow the platform signing and notarization process before publishing a
  desktop installer broadly.

## After publishing

- [ ] Verify README links and image rendering from the public repository page.
- [ ] Test the release archive in a new empty directory.
- [ ] Verify that the security-reporting path is enabled.
- [ ] Keep real user data and result-lineage drafts in local, ignored storage.
