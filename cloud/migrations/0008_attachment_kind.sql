ALTER TABLE attachments
ADD COLUMN kind TEXT NOT NULL DEFAULT 'attachment'
CHECK (kind IN ('inline', 'attachment'));

UPDATE attachments
SET kind = 'inline'
WHERE content_type LIKE 'image/%'
  AND (
    (
      comment_id IS NULL
      AND EXISTS (
        SELECT 1 FROM tasks
        WHERE tasks.id = attachments.task_id
          AND instr(tasks.description, 'api/attachments/' || attachments.id || '/content') > 0
      )
    )
    OR (
      comment_id IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM comments
        WHERE comments.id = attachments.comment_id
          AND instr(comments.body, 'api/attachments/' || attachments.id || '/content') > 0
      )
    )
  );
