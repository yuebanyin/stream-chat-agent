import assert from "node:assert/strict";
import test from "node:test";
import { POST } from "../../app/api/chat/route";

const requestBody = {
  apiKey: "test-secret",
  baseUrl: "https://api.openai.com/v1",
  model: "test-model",
  systemPrompt: "Be helpful.",
  temperature: 0.7,
  maxTokens: 512,
  messages: [{ role: "user", content: "Hello" }],
};

function createRequest(
  body: unknown,
  origin = "http://localhost:3000",
): Request {
  return new Request("http://localhost:3000/api/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Origin: origin,
    },
    body: JSON.stringify(body),
  });
}

test("proxies a validated request and returns normalized SSE events", async () => {
  const originalFetch = globalThis.fetch;
  let upstreamAuthorization: string | null = null;
  let upstreamRedirectMode: RequestRedirect | undefined;

  globalThis.fetch = async (_input, init) => {
    upstreamAuthorization = new Headers(init?.headers).get("Authorization");
    upstreamRedirectMode = init?.redirect;
    return new Response(
      'data: {"choices":[{"delta":{"content":"Hello back"}}]}\n\n' +
        "data: [DONE]\n\n",
      { headers: { "Content-Type": "text/event-stream" } },
    );
  };

  try {
    const response = await POST(createRequest(requestBody));
    const responseText = await response.text();

    assert.equal(response.status, 200);
    assert.equal(
      response.headers.get("content-type"),
      "text/event-stream; charset=utf-8",
    );
    assert.equal(upstreamAuthorization, "Bearer test-secret");
    assert.equal(upstreamRedirectMode, "error");
    assert.match(
      responseText,
      /event: delta\ndata: \{"content":"Hello back"\}/,
    );
    assert.match(responseText, /event: done/);
    assert.equal(responseText.includes("test-secret"), false);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("rejects cross-origin calls before contacting a provider", async () => {
  const originalFetch = globalThis.fetch;
  let calledUpstream = false;
  globalThis.fetch = async () => {
    calledUpstream = true;
    return new Response(null, { status: 500 });
  };

  try {
    const response = await POST(
      createRequest(requestBody, "https://attacker.example"),
    );

    assert.equal(response.status, 403);
    assert.equal(calledUpstream, false);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("proxies local Ollama requests with its non-secret placeholder", async () => {
  const originalFetch = globalThis.fetch;
  let upstreamUrl: string | null = null;
  let usedOllamaPlaceholder = false;
  globalThis.fetch = async (input, init) => {
    upstreamUrl = String(input);
    const authorization = new Headers(init?.headers).get("Authorization");
    usedOllamaPlaceholder = authorization?.endsWith("ollama") ?? false;
    return new Response("data: [DONE]\n\n", {
      headers: { "Content-Type": "text/event-stream" },
    });
  };

  try {
    const response = await POST(
      createRequest({
        ...requestBody,
        apiKey: "ollama",
        baseUrl: "http://localhost:11434/v1",
        model: "llama3.2",
      }),
    );

    assert.equal(response.status, 200);
    assert.equal(upstreamUrl, "http://localhost:11434/v1/chat/completions");
    assert.equal(usedOllamaPlaceholder, true);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
