import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useTaskboardI18n } from "../i18n";
import { LinearIcon } from "./LinearIcon";

interface BoardCardDisplayMenuProps {
  cover: boolean;
  body: boolean;
  onChange: (value: { cover: boolean; body: boolean }) => void;
}

export function BoardCardDisplayMenu({
  cover,
  body,
  onChange,
}: BoardCardDisplayMenuProps) {
  const { text } = useTaskboardI18n();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({ left: 0, top: 0, ready: false });

  useLayoutEffect(() => {
    if (!open || !triggerRef.current || !menuRef.current) return;
    const trigger = triggerRef.current.getBoundingClientRect();
    const menu = menuRef.current.getBoundingClientRect();
    const left = Math.max(8, Math.min(trigger.right - menu.width, window.innerWidth - menu.width - 8));
    const top = trigger.bottom + 8 + menu.height <= window.innerHeight
      ? trigger.bottom + 8
      : Math.max(8, trigger.top - menu.height - 8);
    setPosition({ left, top, ready: true });
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function closeFromOutside(event: PointerEvent) {
      if (!menuRef.current?.contains(event.target as Node) && !triggerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function closeFromEscape(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      setOpen(false);
      triggerRef.current?.focus();
    }
    document.addEventListener("pointerdown", closeFromOutside);
    document.addEventListener("keydown", closeFromEscape);
    return () => {
      document.removeEventListener("pointerdown", closeFromOutside);
      document.removeEventListener("keydown", closeFromEscape);
    };
  }, [open]);

  const menu = open ? createPortal(
    <div
      ref={menuRef}
      className="project-automation-menu no-drag"
      role="dialog"
      aria-label={text("卡片显示设置", "Card display settings")}
      style={{ left: position.left, top: position.top, visibility: position.ready ? "visible" : "hidden" }}
    >
      <div className="project-automation-menu-heading">
        <strong>{text("卡片显示", "Card display")}</strong>
      </div>
      <div className="project-automation-switch">
        <span>{text("封面", "Cover")}</span>
        <button
          type="button"
          className={`board-setting-switch${cover ? " is-on" : ""}`}
          role="switch"
          aria-label={text("封面", "Cover")}
          aria-checked={cover}
          onClick={() => onChange({ cover: !cover, body })}
        >
          <span aria-hidden="true" />
        </button>
      </div>
      <div className="project-automation-switch">
        <span>{text("正文", "Body")}</span>
        <button
          type="button"
          className={`board-setting-switch${body ? " is-on" : ""}`}
          role="switch"
          aria-label={text("正文", "Body")}
          aria-checked={body}
          onClick={() => onChange({ cover, body: !body })}
        >
          <span aria-hidden="true" />
        </button>
      </div>
    </div>,
    document.body,
  ) : null;

  return (
    <>
      <button
        ref={triggerRef}
        className={`task-filter-trigger board-card-display-trigger${open ? " is-open" : ""}`}
        type="button"
        aria-label={text("卡片显示设置", "Card display settings")}
        aria-haspopup="dialog"
        aria-expanded={open}
        title={text("卡片显示", "Card display")}
        onClick={() => {
          if (!open) setPosition({ left: 0, top: 0, ready: false });
          setOpen((current) => !current);
        }}
      >
        <LinearIcon name="displayOptions" />
      </button>
      {menu}
    </>
  );
}
