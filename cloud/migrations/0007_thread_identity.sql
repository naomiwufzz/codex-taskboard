ALTER TABLE tasks ADD COLUMN thread_codex_project_id TEXT;
ALTER TABLE tasks ADD COLUMN thread_codex_project_kind TEXT;
ALTER TABLE tasks ADD COLUMN thread_codex_host_id TEXT;
ALTER TABLE tasks ADD COLUMN thread_workspace_path TEXT;

ALTER TABLE comments ADD COLUMN thread_codex_project_id TEXT;
ALTER TABLE comments ADD COLUMN thread_codex_project_kind TEXT;
ALTER TABLE comments ADD COLUMN thread_codex_host_id TEXT;
ALTER TABLE comments ADD COLUMN thread_workspace_path TEXT;
