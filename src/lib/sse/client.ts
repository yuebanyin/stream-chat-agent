import { createParser } from "eventsource-parser";
import type { ChatRequest } from "@/lib/types";

interface StreamEvent {
  content?: unknown;
  message?: unknown;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

async function getErrorMessage(response: Response): Promise<string> {
  const fallback = `The model request failed (${response.status}).`;
  let body: unknown;
  try {
    body = JSON.parse(await response.text());
  } catch {
    return fallback;
  }
  if (isRecord(body) && typeof body.error === "string") {
    return body.error;
  }
  return fallback;
}

export async function streamChatResponse(
  request: ChatRequest,
  signal: AbortSignal,
  onDelta: (content: string) => void,
): Promise<void> {
  const response = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
    signal,
  });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }

  if (!response.body) {
    throw new Error("The streaming response did not include a readable body.");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let parseError: Error | undefined;
  let completed = false;

  const parser = createParser({
    onEvent(event) {
      let payload: unknown;
      try {
        payload = JSON.parse(event.data);
      } catch {
        parseError = new Error("The server returned an invalid stream event.");
        return;
      }

      if (!isRecord(payload)) {
        parseError = new Error("The server returned an invalid stream event.");
        return;
      }

      const data = payload as StreamEvent;
      if (event.event === "delta" && typeof data.content === "string") {
        onDelta(data.content);
      } else if (event.event === "error") {
        parseError =
          typeof data.message === "string"
            ? new Error(data.message)
            : new Error("The model stream failed.");
      } else if (event.event === "done") {
        completed = true;
      }
    },
    onError() {
      parseError = new Error("The server returned a malformed stream.");
    },
  });

  try {
    while (!completed) {
      const { done, value } = await reader.read();
      parser.feed(decoder.decode(value, { stream: !done }));

      if (parseError) {
        throw parseError;
      }

      if (done) {
        break;
      }
    }

    if (!completed) {
      throw new Error("The stream ended before the model finished replying.");
    }
  } finally {
    reader.releaseLock();
  }
}
