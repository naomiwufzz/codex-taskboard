# Security Policy

## Supported code

Security fixes are applied to the current main branch and to current packaged
desktop releases when a fix is available.

## Reporting a vulnerability

Please do not publish a security issue with a working exploit, private data,
or credentials in a public issue.

Use a private GitHub Security Advisory for this repository when available. In
the report, include:

1. A clear description of the issue.
2. The affected workflow: browser, local service, launcher, embedded panel,
   CLI, desktop package, or cloud collaboration.
3. Reproduction steps that do not expose personal task content or secrets.
4. The practical impact.
5. Any workaround you found.

You should receive an acknowledgement after the report has been reviewed. The
maintainer may ask for a minimal reproduction or coordinate a disclosure date
for a confirmed issue.

## Sensitive areas

Extra care is required around:

- local HTTP binding and LAN exposure;
- Codex CDP ports and launcher behavior;
- local session discovery;
- task databases, attachments, and logs;
- cloud collaboration credentials and path mappings;
- desktop packaging, signing, and updates.

For safer local use, bind the service to loopback:

```bash
CODEX_TASKBOARD_HOST=127.0.0.1 npm start
```

The default LAN mode does not add user authentication. Do not expose it to an
untrusted network or the public internet.

## Privacy

Read [PRIVACY.md](PRIVACY.md) for local-data locations, network activity, and
the optional cloud collaboration boundary.

