import { useEffect, useState } from "react";

import { listCodexSessions } from "../api";
import { taskboardStorage } from "../storage";
import type { CodexSessionCatalogEntry, Task, TaskStatus } from "../types";

const SESSION_SHELF_KEY = "taskboard.codex-session-shelf.v1";

export interface SessionWatch {
  threadId: string;
  needsReview: boolean;
  addedAt: string;
  promotedTaskId?: string;
}

export interface SessionShelfSnapshot {
  sessions: CodexSessionCatalogEntry[];
  watches: SessionWatch[];
}

export interface SessionPromotionDraft {
  title: string;
  status: TaskStatus;
  note: string;
}

interface CodexSessionShelfProps {
  tasks: Task[];
  projectName: string;
  onSnapshotChange: (snapshot: SessionShelfSnapshot) => void;
  onOpenSession: (threadId: string) => void;
  onPromoteSession: (
    session: CodexSessionCatalogEntry,
    draft: SessionPromotionDraft,
  ) => Promise<Task>;
}

function readWatches(): SessionWatch[] {
  try {
    const value = JSON.parse(taskboardStorage.getItem(SESSION_SHELF_KEY) ?? "[]");
    if (!Array.isArray(value)) return [];
    return value.filter((item): item is SessionWatch => (
      item
      && typeof item.threadId === "string"
      && typeof item.needsReview === "boolean"
      && typeof item.addedAt === "string"
      && (item.promotedTaskId === undefined || typeof item.promotedTaskId === "string")
    ));
  } catch {
    return [];
  }
}

function workspaceName(cwd: string | null) {
  if (!cwd) return "未知工作目录";
  return cwd.split("/").filter(Boolean).at(-1) ?? cwd;
}

function sessionDate(value: string) {
  return new Intl.DateTimeFormat("zh-CN", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

const PROMOTION_STATUSES: Array<{ value: TaskStatus; label: string }> = [
  { value: "backlog", label: "待立项" },
  { value: "todo", label: "待办" },
  { value: "in_progress", label: "处理中" },
  { value: "in_review", label: "等你确认" },
  { value: "blocked", label: "遇到阻碍" },
];

export function CodexSessionShelf({
  tasks,
  projectName,
  onSnapshotChange,
  onOpenSession,
  onPromoteSession,
}: CodexSessionShelfProps) {
  const [sessions, setSessions] = useState<CodexSessionCatalogEntry[]>([]);
  const [watches, setWatches] = useState<SessionWatch[]>(readWatches);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [promotionThreadId, setPromotionThreadId] = useState<string | null>(null);
  const [promotionTitle, setPromotionTitle] = useState("");
  const [promotionStatus, setPromotionStatus] = useState<TaskStatus>("todo");
  const [promotionNote, setPromotionNote] = useState("");
  const [promotionError, setPromotionError] = useState("");
  const [promotionSaving, setPromotionSaving] = useState(false);

  useEffect(() => {
    let disposed = false;
    const controller = new AbortController();
    async function load() {
      try {
        const next = await listCodexSessions(100, controller.signal);
        if (disposed) return;
        setSessions(next);
        setLoadFailed(false);
      } catch (error) {
        if (disposed || (error instanceof Error && error.name === "AbortError")) return;
        setLoadFailed(true);
      } finally {
        if (!disposed) setLoading(false);
      }
    }
    void load();
    const timer = window.setInterval(load, 8_000);
    return () => {
      disposed = true;
      controller.abort();
      window.clearInterval(timer);
    };
  }, [refreshKey]);

  useEffect(() => {
    taskboardStorage.setItem(SESSION_SHELF_KEY, JSON.stringify(watches));
    onSnapshotChange({ sessions, watches });
  }, [onSnapshotChange, sessions, watches]);

  const sessionsByThreadId = new Map(sessions.map((session) => [session.threadId, session]));
  const watchedSessions = watches.map((watch) => ({
    watch,
    session: sessionsByThreadId.get(watch.threadId) ?? null,
  }));
  const watchedIds = new Set(watches.map((watch) => watch.threadId));
  const runningCount = sessions.filter((session) => session.running).length;
  const promotionSession = promotionThreadId
    ? sessionsByThreadId.get(promotionThreadId) ?? null
    : null;

  function toggleWatch(threadId: string) {
    setWatches((current) => {
      const existing = current.find((watch) => watch.threadId === threadId);
      if (existing) return current.filter((watch) => watch.threadId !== threadId);
      return [{ threadId, needsReview: false, addedAt: new Date().toISOString() }, ...current];
    });
  }

  function toggleNeedsReview(threadId: string) {
    setWatches((current) => current.map((watch) => (
      watch.threadId === threadId ? { ...watch, needsReview: !watch.needsReview } : watch
    )));
  }

  function taskForSession(threadId: string) {
    return tasks.find((task) => (
      task.threadId === threadId || task.conversationRefs.some((reference) => reference.threadId === threadId)
    )) ?? null;
  }

  function openPromotion(session: CodexSessionCatalogEntry) {
    if (taskForSession(session.threadId)) return;
    setPromotionThreadId(session.threadId);
    setPromotionTitle(session.title);
    setPromotionStatus("todo");
    setPromotionNote("");
    setPromotionError("");
  }

  async function submitPromotion() {
    if (!promotionSession || promotionSaving) return;
    const title = promotionTitle.trim();
    if (!title) {
      setPromotionError("请先给这个议题一个简短标题。");
      return;
    }
    setPromotionSaving(true);
    setPromotionError("");
    try {
      const task = await onPromoteSession(promotionSession, {
        title,
        status: promotionStatus,
        note: promotionNote.trim(),
      });
      setWatches((current) => current.map((watch) => (
        watch.threadId === promotionSession.threadId
          ? { ...watch, needsReview: false, promotedTaskId: task.id }
          : watch
      )));
      setPromotionThreadId(null);
    } catch (error) {
      setPromotionError(error instanceof Error ? error.message : "创建议题失败，请重试。");
    } finally {
      setPromotionSaving(false);
    }
  }

  return (
    <section className="codex-session-shelf" aria-label="Codex 会话池">
      <header className="codex-session-shelf-header">
        <div>
          <span>Codex 会话池</span>
          <p>本机只读索引。选择会话只是加入关注，不会创建议题或导入完整聊天。</p>
        </div>
        <div className="codex-session-shelf-actions">
          <button type="button" onClick={() => setRefreshKey((value) => value + 1)}>
            刷新
          </button>
          <button type="button" className="is-primary" onClick={() => setPickerOpen((value) => !value)}>
            {pickerOpen ? "收起会话" : `选择历史会话${watches.length ? ` (${watches.length})` : ""}`}
          </button>
        </div>
      </header>

      {pickerOpen && (
        <div className="codex-session-picker">
          <div className="codex-session-picker-note">
            <strong>最近 100 条本机 session</strong>
            <span>{runningCount ? `${runningCount} 条正在运行` : "当前没有运行中的本机 session"}</span>
          </div>
          <div className="codex-session-picker-list">
            {sessions.map((session) => (
              <label className="codex-session-picker-row" key={session.threadId}>
                <input
                  type="checkbox"
                  checked={watchedIds.has(session.threadId)}
                  onChange={() => toggleWatch(session.threadId)}
                />
                <span className={session.running ? "session-live-dot" : "session-idle-dot"} aria-hidden="true" />
                <span className="codex-session-picker-copy">
                  <strong>{session.title}</strong>
                  <small>{workspaceName(session.cwd)} · {sessionDate(session.updatedAt)}</small>
                </span>
                {session.running && <b>运行中</b>}
              </label>
            ))}
          </div>
        </div>
      )}

      <div className="codex-session-shelf-body">
        {loading ? (
          <div className="codex-session-shelf-empty">正在读取本机 Codex session…</div>
        ) : loadFailed ? (
          <div className="codex-session-shelf-empty">暂时无法读取本机 session，可点击“刷新”重试。</div>
        ) : watchedSessions.length ? watchedSessions.map(({ watch, session }) => (
          <article className="codex-session-watch" key={watch.threadId}>
            <span className={session?.running ? "session-live-dot" : "session-idle-dot"} aria-hidden="true" />
            <button type="button" className="codex-session-watch-main" onClick={() => onOpenSession(watch.threadId)}>
              <strong>{session?.title ?? "已选择的较早会话"}</strong>
              <small>
                {session ? `${workspaceName(session.cwd)} · ${sessionDate(session.updatedAt)}` : watch.threadId}
              </small>
            </button>
            <div className="codex-session-watch-actions">
              {session?.running && <b>运行中</b>}
              {session && taskForSession(session.threadId) ? (
                <span className="codex-session-promoted">已提升为议题</span>
              ) : session ? (
                <button type="button" className="is-promote" onClick={() => openPromotion(session)}>
                  提升为议题
                </button>
              ) : null}
              <button type="button" onClick={() => toggleNeedsReview(watch.threadId)}>
                {watch.needsReview ? "取消提醒" : "仪表盘提醒"}
              </button>
              <button type="button" onClick={() => toggleWatch(watch.threadId)}>移除</button>
            </div>
          </article>
        )) : (
          <div className="codex-session-shelf-empty">
            先从“选择历史会话”勾选值得跟进的 session；完成后再决定是否提升为议题。
          </div>
        )}
      </div>

      {promotionSession && (
        <div className="codex-session-promotion-backdrop" role="presentation">
          <section
            className="codex-session-promotion-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="codex-session-promotion-title"
          >
            <header>
              <div>
                <span id="codex-session-promotion-title">提升为议题</span>
                <p>将写入当前项目「{projectName}」，不复制完整对话。</p>
              </div>
              <button type="button" onClick={() => setPromotionThreadId(null)} aria-label="关闭">关闭</button>
            </header>
            <label>
              议题标题
              <input value={promotionTitle} onChange={(event) => setPromotionTitle(event.target.value)} />
            </label>
            <label>
              初始状态
              <select
                value={promotionStatus}
                onChange={(event) => setPromotionStatus(event.target.value as TaskStatus)}
              >
                {PROMOTION_STATUSES.map((status) => (
                  <option key={status.value} value={status.value}>{status.label}</option>
                ))}
              </select>
            </label>
            <label>
              为什么要持续跟进（可选）
              <textarea
                value={promotionNote}
                onChange={(event) => setPromotionNote(event.target.value)}
                placeholder="例如：需要我确认结果、继续执行下一步，或补齐验证。"
                rows={3}
              />
            </label>
            <div className="codex-session-promotion-evidence">
              <strong>原 session 证据</strong>
              <span>{workspaceName(promotionSession.cwd)} · codex://threads/{promotionSession.threadId}</span>
            </div>
            {promotionError && <p className="codex-session-promotion-error">{promotionError}</p>}
            <footer>
              <button type="button" onClick={() => setPromotionThreadId(null)}>取消</button>
              <button
                type="button"
                className="is-primary"
                onClick={() => void submitPromotion()}
                disabled={promotionSaving}
              >
                {promotionSaving ? "正在创建…" : "创建议题"}
              </button>
            </footer>
          </section>
        </div>
      )}
    </section>
  );
}
