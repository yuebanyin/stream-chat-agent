"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowUp, Square } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useUiPreferences } from "@/lib/ui-preferences";

interface ChatInputProps {
  isStreaming: boolean;
  onSend: (message: string) => void;
  onStop: () => void;
}

export function ChatInput({ isStreaming, onSend, onStop }: ChatInputProps) {
  const { t } = useUiPreferences();
  const messageSchema = z.object({
    message: z.string().trim().min(1, t("writeMessage")).max(20_000),
  });
  type MessageFormValues = z.infer<typeof messageSchema>;
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<MessageFormValues>({
    resolver: zodResolver(messageSchema),
    defaultValues: { message: "" },
  });

  function submit(values: MessageFormValues) {
    onSend(values.message);
    reset();
  }

  return (
    <div className="composer-wrap">
      <form className="composer" onSubmit={handleSubmit(submit)}>
        <textarea
          aria-label={t("message")}
          autoComplete="off"
          disabled={isStreaming}
          maxLength={20_000}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              void handleSubmit(submit)();
            }
          }}
          placeholder={t("askAnything")}
          rows={1}
          {...register("message", {
            onChange: (event) => {
              const textarea = event.target as HTMLTextAreaElement;
              textarea.style.height = "auto";
              textarea.style.height = `${Math.min(textarea.scrollHeight, 180)}px`;
            },
          })}
        />
        {isStreaming ? (
          <button
            aria-label={t("stopGenerating")}
            className="send-button stop-button"
            onClick={onStop}
            type="button"
          >
            <Square fill="currentColor" size={13} />
          </button>
        ) : (
          <button
            aria-label={t("sendMessage")}
            className="send-button"
            disabled={isStreaming}
            type="submit"
          >
            <ArrowUp size={18} strokeWidth={2.2} />
          </button>
        )}
      </form>
      {errors.message && (
        <p className="composer-error">{errors.message.message}</p>
      )}
      <p className="composer-hint">{t("composerHint")}</p>
    </div>
  );
}
