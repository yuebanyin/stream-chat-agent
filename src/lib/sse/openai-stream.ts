import { createParser } from "eventsource-parser";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export async function* readOpenAIContent(
  body: ReadableStream<Uint8Array>,
  signal: AbortSignal,
): AsyncGenerator<string> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  const pendingContent: string[] = [];
  let parseError: Error | undefined;
  let streamFinished = false;

  const parser = createParser({
    onEvent(event) {
      if (event.data === "[DONE]") {
        streamFinished = true;
        return;
      }

      try {
        const chunk: unknown = JSON.parse(event.data);
        if (!isRecord(chunk)) {
          throw new Error("The model returned an invalid streaming response.");
        }

        if ("error" in chunk) {
          throw new Error("The model returned an error during streaming.");
        }

        const choices = chunk.choices;
        if (!Array.isArray(choices) || !isRecord(choices[0])) {
          return;
        }
        const delta = choices[0].delta;
        if (!isRecord(delta)) {
          return;
        }
        const content = delta.content;
        if (typeof content === "string" && content.length > 0) {
          pendingContent.push(content);
        }
      } catch (error) {
        parseError = new Error(
          error instanceof Error &&
            error.message === "The model returned an error during streaming."
            ? error.message
            : "The model returned an invalid streaming response.",
        );
      }
    },
    onError() {
      parseError = new Error("The model returned an invalid SSE event.");
    },
  });

  try {
    while (!streamFinished) {
      if (signal.aborted) {
        throw new DOMException("The request was cancelled.", "AbortError");
      }

      const { done, value } = await reader.read();
      parser.feed(decoder.decode(value, { stream: !done }));

      if (parseError) {
        throw parseError;
      }

      while (pendingContent.length > 0) {
        yield pendingContent.shift()!;
      }

      if (done) {
        break;
      }
    }
  } finally {
    reader.releaseLock();
  }
}
