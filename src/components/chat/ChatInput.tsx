"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowUp, Square } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const messageSchema = z.object({
  message: z.string().trim().min(1, "Write a message first.").max(20_000),
});

type MessageFormValues = z.infer<typeof messageSchema>;

interface ChatInputProps {
  isStreaming: boolean;
  onSend: (message: string) => void;
  onStop: () => void;
}

export function ChatInput({ isStreaming, onSend, onStop }: ChatInputProps) {
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
          aria-label="Message"
          autoComplete="off"
          disabled={isStreaming}
          maxLength={20_000}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.preventDefault();
              void handleSubmit(submit)();
            }
          }}
          placeholder="Ask anything..."
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
            aria-label="Stop generating"
            className="send-button stop-button"
            onClick={onStop}
            type="button"
          >
            <Square fill="currentColor" size={13} />
          </button>
        ) : (
          <button
            aria-label="Send message"
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
      <p className="composer-hint">
        Enter to send · Shift + Enter for a new line
      </p>
    </div>
  );
}
