"use client";

import {
  GitBranch,
  Menu,
  MoreHorizontal,
  Settings2,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { ChatInput } from "@/components/chat/ChatInput";
import { ChatSidebar } from "@/components/chat/ChatSidebar";
import { MessageList } from "@/components/chat/MessageList";
import { SettingsPanel } from "@/components/settings/SettingsPanel";
import { streamChatResponse } from "@/lib/sse/client";
import { useChatStore } from "@/lib/store/chat-store";
import type { ChatMessage } from "@/lib/types";

function createMessage(
  role: ChatMessage["role"],
  content: string,
): ChatMessage {
  return {
    id: crypto.randomUUID(),
    role,
    content,
    createdAt: Date.now(),
  };
}

export function ChatApp() {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [pendingPrompt, setPendingPrompt] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const sessions = useChatStore((state) => state.sessions);
  const activeSessionId = useChatStore((state) => state.activeSessionId);
  const activeSession = useChatStore((state) =>
    state.sessions.find((session) => session.id === state.activeSessionId),
  );
  const settings = useChatStore((state) => state.settings);
  const isHydrated = useChatStore((state) => state.isHydrated);
  const streamingSessionId = useChatStore((state) => state.streamingSessionId);
  const error = useChatStore((state) => state.error);

  useEffect(() => {
    void useChatStore.persist.rehydrate();
  }, []);

  useEffect(
    () => () => {
      abortControllerRef.current?.abort();
    },
    [],
  );

  useEffect(() => {
    function handleShortcut(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        if (!useChatStore.getState().streamingSessionId) {
          useChatStore.getState().createSession();
        }
      }
    }

    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, []);

  function createSession() {
    useChatStore.getState().createSession();
    setMobileSidebarOpen(false);
  }

  function deleteSession(sessionId: string) {
    useChatStore.getState().deleteSession(sessionId);
  }

  function stopGenerating() {
    abortControllerRef.current?.abort();
  }

  async function sendMessage(content: string) {
    const store = useChatStore.getState();
    if (store.streamingSessionId) {
      return;
    }
    if (!store.settings.apiKey.trim()) {
      setPendingPrompt(content);
      store.setError("Add your model API key to send this message.");
      setSettingsOpen(true);
      return;
    }

    const sessionId = store.activeSessionId ?? store.createSession();
    const userMessage = createMessage("user", content);
    const session = useChatStore
      .getState()
      .sessions.find((item) => item.id === sessionId);
    const history = [
      ...(session?.messages ?? []).filter(
        (
          message,
        ): message is ChatMessage & {
          role: "user" | "assistant";
        } => message.role !== "system",
      ),
      userMessage,
    ].map(({ role, content: messageContent }) => ({
      role,
      content: messageContent,
    }));
    const assistantMessage = createMessage("assistant", "");

    store.addMessage(sessionId, userMessage);
    store.addMessage(sessionId, assistantMessage);
    store.setError(null);
    store.setStreamingSession(sessionId);

    const controller = new AbortController();
    abortControllerRef.current = controller;
    let responseText = "";

    try {
      await streamChatResponse(
        {
          ...store.settings,
          messages: history,
        },
        controller.signal,
        (delta) => {
          responseText += delta;
          useChatStore
            .getState()
            .updateMessage(sessionId, assistantMessage.id, responseText);
        },
      );
    } catch (requestError) {
      if (controller.signal.aborted) {
        if (!responseText) {
          useChatStore.getState().removeMessage(sessionId, assistantMessage.id);
        }
      } else {
        useChatStore.getState().removeMessage(sessionId, assistantMessage.id);
        useChatStore
          .getState()
          .setError(
            requestError instanceof Error
              ? requestError.message
              : "The model request failed. Check your settings and try again.",
          );
      }
    } finally {
      if (abortControllerRef.current === controller) {
        abortControllerRef.current = null;
      }
      useChatStore.getState().setStreamingSession(null);
    }
  }

  function handleSettingsSaved() {
    if (pendingPrompt) {
      const prompt = pendingPrompt;
      setPendingPrompt(null);
      void sendMessage(prompt);
    }
  }

  if (!isHydrated) {
    return (
      <main aria-label="Loading saved conversations" className="app-loading">
        <div className="loading-mark">S</div>
        <p>Preparing your workspace...</p>
      </main>
    );
  }

  const isStreaming = streamingSessionId !== null;
  const activeIsStreaming = streamingSessionId === activeSession?.id;

  return (
    <main className="app-shell">
      <ChatSidebar
        activeSessionId={activeSessionId}
        isStreaming={isStreaming}
        isVisible={mobileSidebarOpen}
        onClose={() => setMobileSidebarOpen(false)}
        onCreateSession={createSession}
        onDeleteSession={deleteSession}
        onOpenSettings={() => setSettingsOpen(true)}
        onSelectSession={(sessionId) => {
          useChatStore.getState().setActiveSession(sessionId);
          setMobileSidebarOpen(false);
        }}
        sessions={sessions}
      />

      <section className="chat-workspace">
        <header className="topbar">
          <div className="topbar-left">
            <button
              aria-label="Open navigation"
              className="icon-button mobile-menu-button"
              onClick={() => setMobileSidebarOpen(true)}
              type="button"
            >
              <Menu size={19} />
            </button>
            <div className="workspace-title">
              <span className="workspace-overline">WORKSPACE</span>
              <span className="workspace-name">
                {activeSession?.title ?? "New conversation"}
              </span>
            </div>
          </div>
          <div className="topbar-actions">
            <button
              aria-label={`Current model: ${settings.model || "No model selected"}. Open model settings`}
              className="model-chip"
              onClick={() => setSettingsOpen(true)}
              type="button"
            >
              <span aria-hidden="true" className="model-chip-dot" />
              {settings.model || "No model selected"}
            </button>
            <button
              aria-label="Open model settings"
              className="icon-button settings-icon-button"
              onClick={() => setSettingsOpen(true)}
              type="button"
            >
              <Settings2 size={17} />
            </button>
            {activeSession && (
              <button
                aria-label="Clear conversation"
                className="icon-button clear-icon-button"
                disabled={isStreaming}
                onClick={() =>
                  useChatStore.getState().clearSession(activeSession.id)
                }
                type="button"
              >
                <Trash2 size={16} />
              </button>
            )}
            <a
              aria-label="Open GitHub"
              className="icon-button github-link"
              href={
                process.env.NEXT_PUBLIC_GITHUB_URL ??
                "https://github.com/yuebanyin/stream-chat-agent"
              }
              rel="noreferrer noopener"
              target="_blank"
            >
              <GitBranch size={17} />
            </a>
            <button
              aria-label="More options"
              className="icon-button more-button"
              onClick={() => setSettingsOpen(true)}
              type="button"
            >
              <MoreHorizontal size={19} />
            </button>
          </div>
        </header>

        {error && (
          <div className="error-banner" role="alert">
            <span>{error}</span>
            <button
              aria-label="Dismiss error"
              className="error-dismiss"
              onClick={() => useChatStore.getState().setError(null)}
              type="button"
            >
              <X size={15} />
            </button>
          </div>
        )}

        <div className="conversation-stage">
          <MessageList
            isStreaming={activeIsStreaming}
            messages={activeSession?.messages ?? []}
          />
          {!settings.apiKey.trim() && (
            <div className="setup-notice">
              <Sparkles size={16} />
              <span>Connect a model to start chatting.</span>
              <button onClick={() => setSettingsOpen(true)} type="button">
                Set up model
              </button>
            </div>
          )}
        </div>

        <ChatInput
          isStreaming={activeIsStreaming}
          onSend={(message) => void sendMessage(message)}
          onStop={stopGenerating}
        />
      </section>

      {settingsOpen && (
        <SettingsPanel
          onClose={() => setSettingsOpen(false)}
          onSaved={handleSettingsSaved}
        />
      )}
    </main>
  );
}
