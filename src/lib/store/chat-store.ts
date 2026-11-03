"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { ChatMessage, ChatSession, ModelSettings } from "@/lib/types";

interface ChatStore {
  sessions: ChatSession[];
  activeSessionId: string | null;
  settings: ModelSettings;
  isHydrated: boolean;
  streamingSessionId: string | null;
  error: string | null;
  setHasHydrated: (isHydrated: boolean) => void;
  createSession: () => string;
  deleteSession: (sessionId: string) => void;
  setActiveSession: (sessionId: string | null) => void;
  clearSession: (sessionId: string) => void;
  addMessage: (sessionId: string, message: ChatMessage) => void;
  updateMessage: (
    sessionId: string,
    messageId: string,
    content: string,
  ) => void;
  removeMessage: (sessionId: string, messageId: string) => void;
  updateSettings: (settings: ModelSettings) => void;
  setStreamingSession: (sessionId: string | null) => void;
  setError: (error: string | null) => void;
}

type PersistedChatState = Pick<
  ChatStore,
  "sessions" | "activeSessionId" | "settings"
>;

const defaultSettings: ModelSettings = {
  apiKey: "",
  baseUrl: "https://api.openai.com/v1",
  model: "gpt-4o-mini",
  systemPrompt: "You are a helpful assistant. Be clear, accurate, and concise.",
  temperature: 0.7,
  maxTokens: 2_048,
};

function updateSession(
  sessions: ChatSession[],
  sessionId: string,
  updater: (session: ChatSession) => ChatSession,
): ChatSession[] {
  return sessions.map((session) =>
    session.id === sessionId ? updater(session) : session,
  );
}

export const useChatStore = create<ChatStore>()(
  persist(
    (set, get) => ({
      sessions: [],
      activeSessionId: null,
      settings: defaultSettings,
      isHydrated: false,
      streamingSessionId: null,
      error: null,
      setHasHydrated: (isHydrated) => set({ isHydrated }),
      createSession: () => {
        const now = Date.now();
        const session: ChatSession = {
          id: crypto.randomUUID(),
          title: "New chat",
          createdAt: now,
          updatedAt: now,
          messages: [],
        };
        set((state) => ({
          sessions: [session, ...state.sessions],
          activeSessionId: session.id,
          error: null,
        }));
        return session.id;
      },
      deleteSession: (sessionId) => {
        const remainingSessions = get().sessions.filter(
          (session) => session.id !== sessionId,
        );
        set((state) => ({
          sessions: remainingSessions,
          activeSessionId:
            state.activeSessionId === sessionId
              ? (remainingSessions[0]?.id ?? null)
              : state.activeSessionId,
        }));
      },
      setActiveSession: (sessionId) => set({ activeSessionId: sessionId }),
      clearSession: (sessionId) =>
        set((state) => ({
          sessions: updateSession(state.sessions, sessionId, (session) => ({
            ...session,
            title: "New chat",
            updatedAt: Date.now(),
            messages: [],
          })),
          error: null,
        })),
      addMessage: (sessionId, message) =>
        set((state) => ({
          sessions: updateSession(state.sessions, sessionId, (session) => ({
            ...session,
            title:
              message.role === "user" && session.title === "New chat"
                ? message.content.slice(0, 40)
                : session.title,
            updatedAt: Date.now(),
            messages: [...session.messages, message],
          })),
        })),
      updateMessage: (sessionId, messageId, content) =>
        set((state) => ({
          sessions: updateSession(state.sessions, sessionId, (session) => ({
            ...session,
            updatedAt: Date.now(),
            messages: session.messages.map((message) =>
              message.id === messageId ? { ...message, content } : message,
            ),
          })),
        })),
      removeMessage: (sessionId, messageId) =>
        set((state) => ({
          sessions: updateSession(state.sessions, sessionId, (session) => ({
            ...session,
            messages: session.messages.filter(
              (message) => message.id !== messageId,
            ),
          })),
        })),
      updateSettings: (settings) => set({ settings }),
      setStreamingSession: (sessionId) =>
        set({ streamingSessionId: sessionId }),
      setError: (error) => set({ error }),
    }),
    {
      name: "stream-chat-agent",
      version: 1,
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
      partialize: (state): PersistedChatState => ({
        sessions: state.sessions,
        activeSessionId: state.activeSessionId,
        settings: state.settings,
      }),
      onRehydrateStorage: () => (state, error) => {
        if (error) {
          console.error(
            "Could not restore saved chats from local storage.",
            error,
          );
        }
        state?.setHasHydrated(true);
      },
    },
  ),
);
