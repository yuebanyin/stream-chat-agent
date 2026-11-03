"use client";

import { MessageSquarePlus, Settings2, Trash2 } from "lucide-react";
import type { ChatSession } from "@/lib/types";
import { useUiPreferences } from "@/lib/ui-preferences";

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
  const { t, language, toggleLanguage, theme, toggleTheme } =
    useUiPreferences();
  return (
    <>
      {isVisible && (
        <button
          aria-label={t("closeNavigation")}
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
            <p className="brand-caption">{t("brandCaption")}</p>
          </div>
        </div>

        <button
          className="new-chat-button"
          disabled={isStreaming}
          onClick={onCreateSession}
          type="button"
        >
          <MessageSquarePlus size={17} />
          <span>{t("newConversation")}</span>
          <kbd>⌘ K</kbd>
        </button>

        <div className="sidebar-section-heading">
          <span>{t("recent")}</span>
          <span>{sessions.length.toString().padStart(2, "0")}</span>
        </div>
        <nav aria-label={t("conversations")} className="session-list">
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
                <span className="session-title">
                  {!session.title || session.title === "New chat"
                    ? t("newConversation")
                    : session.title}
                </span>
              </button>
              <button
                aria-label={`${t("deleteConversation")}: ${session.title}`}
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
            <p className="empty-sessions">{t("emptyConversations")}</p>
          )}
        </nav>

        <div className="sidebar-bottom">
          <div className="sidebar-status">
            <span aria-hidden="true" className="status-indicator" />
            <span>{t("privateByDesign")}</span>
          </div>
          <button
            className="settings-link"
            onClick={onOpenSettings}
            type="button"
          >
            <Settings2 size={17} />
            <span>{t("modelSettings")}</span>
          </button>
          <div className="sidebar-preferences">
            <button
              aria-label={t("switchLanguage")}
              className="preference-button"
              onClick={toggleLanguage}
              title={t("switchLanguage")}
              type="button"
            >
              {language === "en" ? t("langChinese") : t("langEnglish")}
            </button>
            <button
              aria-label={theme === "light" ? t("themeDark") : t("themeLight")}
              className="preference-button"
              onClick={toggleTheme}
              title={theme === "light" ? t("themeDark") : t("themeLight")}
              type="button"
            >
              {theme === "light" ? t("dark") : t("light")}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
