"use client";

import { Bot, User } from "lucide-react";
import { useEffect, useRef } from "react";
import type { ChatMessage } from "@/lib/types";
import { MarkdownContent } from "@/components/chat/MarkdownContent";
import { useUiPreferences } from "@/lib/ui-preferences";

interface MessageListProps {
  messages: ChatMessage[];
  isStreaming: boolean;
}

export function MessageList({ messages, isStreaming }: MessageListProps) {
  const { t } = useUiPreferences();
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = listRef.current;
    if (element) {
      element.scrollTo({ top: element.scrollHeight, behavior: "smooth" });
    }
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className="welcome-panel">
        <div aria-hidden="true" className="welcome-mark">
          <Bot size={25} strokeWidth={1.7} />
        </div>
        <p className="eyebrow">STREAMCHAT</p>
        <h1>{t("welcomeTitle")}</h1>
        <p className="welcome-description">{t("welcomeDescription")}</p>
        <div className="suggestion-grid">
          <div className="suggestion-card">
            <span className="suggestion-icon">01</span>
            <p>{t("suggestionOne")}</p>
          </div>
          <div className="suggestion-card">
            <span className="suggestion-icon">02</span>
            <p>{t("suggestionTwo")}</p>
          </div>
          <div className="suggestion-card">
            <span className="suggestion-icon">03</span>
            <p>{t("suggestionThree")}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div aria-live="polite" className="message-list" ref={listRef}>
      {messages
        .filter((message) => message.role !== "system")
        .map((message, index) => {
          const isUser = message.role === "user";
          return (
            <article
              className={`message-row ${isUser ? "message-row-user" : ""}`}
              key={message.id}
            >
              <div
                aria-hidden="true"
                className={`message-avatar ${isUser ? "message-avatar-user" : ""}`}
              >
                {isUser ? <User size={15} /> : <Bot size={16} />}
              </div>
              <div className="message-body">
                <div className="message-author">
                  {isUser ? t("you") : t("assistant")}
                </div>
                <div className="message-content">
                  {message.content ? (
                    <MarkdownContent content={message.content} />
                  ) : isStreaming && index === messages.length - 1 ? (
                    <span
                      aria-label={t("generatingResponse")}
                      className="typing-indicator"
                    >
                      <i />
                      <i />
                      <i />
                    </span>
                  ) : null}
                </div>
              </div>
            </article>
          );
        })}
    </div>
  );
}
