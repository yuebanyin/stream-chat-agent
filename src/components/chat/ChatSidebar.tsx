"use client";

import { MessageSquarePlus, Settings2, Trash2 } from "lucide-react";
import type { ChatSession } from "@/lib/types";

interface ChatSidebarProps {
  activeSessionId: string | null;
  isStreaming: boolean;
  isVisible: boolean;
  sessions: ChatSession[];
  onClose: () => void;
  onCreateSession: () => void;
  onDeleteSession: (sessionId: string) => void;
  onOpenSettings: () => void;
  onSelectSession: (sessionId: string) => void;
}

export function ChatSidebar({
  activeSessionId,
  isStreaming,
  isVisible,
  sessions,
  onClose,
  onCreateSession,
  onDeleteSession,
  onOpenSettings,
  onSelectSession,
}: ChatSidebarProps) {
  return (
    <>
      {isVisible && (
        <button
          aria-label="Close navigation"
          className="mobile-backdrop"
          onClick={onClose}
          type="button"
        />
      )}
      <aside className={`sidebar ${isVisible ? "sidebar-open" : ""}`}>
        <div className="sidebar-brand">
          <div aria-hidden="true" className="brand-mark">
            S
          </div>
          <div>
            <p className="brand-name">streamchat</p>
            <p className="brand-caption">YOUR AI WORKSPACE</p>
          </div>
        </div>

        <button
          className="new-chat-button"
          disabled={isStreaming}
          onClick={onCreateSession}
          type="button"
        >
          <MessageSquarePlus size={17} />
          <span>New conversation</span>
          <kbd>⌘ K</kbd>
        </button>

        <div className="sidebar-section-heading">
          <span>RECENT</span>
          <span>{sessions.length.toString().padStart(2, "0")}</span>
        </div>
        <nav aria-label="Conversations" className="session-list">
          {sessions.map((session) => (
            <div className="session-item" key={session.id}>
              <button
                aria-current={
                  session.id === activeSessionId ? "page" : undefined
                }
                className={`session-select ${session.id === activeSessionId ? "session-active" : ""}`}
                disabled={isStreaming}
                onClick={() => onSelectSession(session.id)}
                type="button"
              >
                <span className="session-dot" />
                <span className="session-title">{session.title}</span>
              </button>
              <button
                aria-label={`Delete ${session.title}`}
                className="session-delete"
                disabled={isStreaming}
                onClick={() => onDeleteSession(session.id)}
                type="button"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
          {sessions.length === 0 && (
            <p className="empty-sessions">
              Your conversations will appear here.
            </p>
          )}
        </nav>

        <div className="sidebar-bottom">
          <div className="sidebar-status">
            <span aria-hidden="true" className="status-indicator" />
            <span>Private by design</span>
          </div>
          <button
            className="settings-link"
            onClick={onOpenSettings}
            type="button"
          >
            <Settings2 size={17} />
            <span>Model settings</span>
          </button>
        </div>
      </aside>
    </>
  );
}
