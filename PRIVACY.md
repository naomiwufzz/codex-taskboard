# Privacy

Naomi Taskboard is a local-first application. Its desktop launcher runs the
Taskboard service on the local computer and does not send Taskboard content or
usage telemetry to the project maintainers.

## Data stored on the computer

On Windows, Naomi Taskboard stores its database, attachments, launcher runtime
file, and independent Codex browser profile under:

`%APPDATA%\Naomi Taskboard`

Launcher logs are stored under:

`%LOCALAPPDATA%\Naomi Taskboard\Logs`

The launcher also installs the bundled `manage-naomi-taskboard` Skill in the current
user's `.agents\skills\manage-naomi-taskboard` directory.

## Network activity

- The desktop app uses a loopback-only HTTP service to connect the embedded
  panel, the launcher, and `naomi-taskctl` on the same computer.
- Automatic updates are disabled in the 2.0.0 source release. No Naomi
  release endpoint or updater key is configured.
- The official Codex application and Codex CLI use OpenAI services under the
  user's existing OpenAI account and OpenAI's terms.
- Cloud collaboration is optional. When a user configures it, Taskboard data is
  sent to the deployment selected by that user.
- Some workflow catalog icons can be loaded from their published websites.

Naomi Taskboard does not include advertising or a project-maintainer analytics
service.

## Removing data

Uninstalling the Windows application removes the installed program but keeps
user data and the installed Skill. See
[Windows uninstall](docs/windows-uninstall.md) for the optional manual cleanup.
