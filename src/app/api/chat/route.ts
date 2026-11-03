import { NextResponse } from "next/server";
import {
  ChatRequestSchema,
  getAllowedModelHosts,
  getChatCompletionsUrl,
  validateBaseUrl,
} from "@/lib/api/validation";
import { readOpenAIContent } from "@/lib/sse/openai-stream";

export const runtime = "nodejs";
export const maxDuration = 120;

const encoder = new TextEncoder();

function jsonError(message: string, status: number): NextResponse {
  return NextResponse.json({ error: message }, { status });
}

function toSseEvent(event: string, payload: object): Uint8Array {
  return encoder.encode(
    `event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`,
  );
}

function isSameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) {
    return true;
  }

  try {
    return new URL(origin).origin === new URL(request.url).origin;
  } catch {
    return false;
  }
}

function getProviderError(status: number): string {
  if (status === 401 || status === 403) {
    return "The model provider rejected the API key. Check your model settings.";
  }
  if (status === 429) {
    return "The model provider is rate-limiting requests. Try again shortly.";
  }
  if (status === 400) {
    return "The model rejected this request. Check the selected model and settings.";
  }
  if (status === 404) {
    return "The model endpoint or model name was not found. Check your settings.";
  }
  return "The model provider could not complete the request.";
}

export async function POST(request: Request): Promise<Response> {
  if (!isSameOrigin(request)) {
    return jsonError("Cross-origin requests are not allowed.", 403);
  }

  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > 256_000) {
    return jsonError("The request is too large.", 413);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("The request body must be valid JSON.", 400);
  }

  const parsed = ChatRequestSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(
      parsed.error.issues[0]?.message ?? "The chat request is invalid.",
      400,
    );
  }

  const input = parsed.data;
  let baseUrl: URL;
  try {
    baseUrl = validateBaseUrl(input.baseUrl, {
      nodeEnv: process.env.NODE_ENV,
      allowedHosts: getAllowedModelHosts(),
    });
  } catch (error) {
    return jsonError(
      error instanceof Error ? error.message : "The model API URL is invalid.",
      400,
    );
  }

  const upstreamAbort = new AbortController();
  const timeoutSignal = AbortSignal.timeout(120_000);
  const signal = AbortSignal.any([
    request.signal,
    timeoutSignal,
    upstreamAbort.signal,
  ]);
  let upstream: Response;

  try {
    upstream = await fetch(getChatCompletionsUrl(baseUrl), {
      method: "POST",
      headers: {
        Authorization: `Bearer ${input.apiKey}`,
        "Content-Type": "application/json",
        Accept: "text/event-stream",
      },
      body: JSON.stringify({
        model: input.model,
        messages: [
          ...(input.systemPrompt
            ? [{ role: "system" as const, content: input.systemPrompt }]
            : []),
          ...input.messages,
        ],
        temperature: input.temperature,
        max_tokens: input.maxTokens,
        stream: true,
      }),
      redirect: "error",
      signal,
      cache: "no-store",
    });
  } catch (error) {
    if (request.signal.aborted) {
      return jsonError("The request was cancelled.", 499);
    }
    if (timeoutSignal.aborted) {
      return jsonError("The model request timed out. Try again.", 504);
    }
    console.error("Could not connect to the configured model provider.", {
      errorName: error instanceof Error ? error.name : "UnknownError",
    });
    return jsonError("Could not connect to the model provider.", 502);
  }

  if (!upstream.ok) {
    return jsonError(getProviderError(upstream.status), upstream.status);
  }
  if (!upstream.body) {
    return jsonError("The model provider returned an empty stream.", 502);
  }
  const upstreamBody = upstream.body;

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const content of readOpenAIContent(upstreamBody, signal)) {
          controller.enqueue(toSseEvent("delta", { content }));
        }
        if (!upstreamAbort.signal.aborted) {
          controller.enqueue(toSseEvent("done", {}));
          controller.close();
        }
      } catch (error) {
        if (upstreamAbort.signal.aborted) {
          return;
        }
        if (request.signal.aborted) {
          controller.close();
          return;
        }

        const message = timeoutSignal.aborted
          ? "The model request timed out. Try again."
          : "The model stream ended unexpectedly. Try again.";
        console.error("The model stream could not be completed.", {
          errorName: error instanceof Error ? error.name : "UnknownError",
        });
        controller.enqueue(toSseEvent("error", { message }));
        controller.close();
      }
    },
    cancel() {
      upstreamAbort.abort();
    },
  });

  return new Response(stream, {
    headers: {
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "Content-Type": "text/event-stream; charset=utf-8",
      "X-Accel-Buffering": "no",
    },
  });
}
