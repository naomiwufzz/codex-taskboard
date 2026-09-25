# Deferred Desktop Release Work

The Naomi Taskboard 2.0.0 source release intentionally does not publish a
macOS or Windows application artifact.

Before enabling desktop distribution, a maintainer must separately establish:

- a Naomi-owned public repository and release workflow;
- a Tauri updater signing key and protected secret storage;
- a Naomi-owned updater manifest and artifact URL;
- Apple Developer signing and notarization identities for macOS;
- a Windows signing owner and approval process;
- a clean install, upgrade, rollback, and uninstall test matrix.

Until those decisions are complete, automatic updates remain disabled and the
source release should be run with `npm start` or the documented development
commands.
