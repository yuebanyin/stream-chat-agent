import assert from "node:assert/strict";
import test from "node:test";
import {
  ChatRequestSchema,
  getChatCompletionsUrl,
  validateBaseUrl,
} from "./validation";

test("validates a supported provider base URL", () => {
  const url = validateBaseUrl("https://api.groq.com/openai/v1", {
    nodeEnv: "production",
  });

  assert.equal(url.origin, "https://api.groq.com");
  assert.equal(
    getChatCompletionsUrl(url).toString(),
    "https://api.groq.com/openai/v1/chat/completions",
  );
});

test("allows a configured custom provider by exact hostname", () => {
  const url = validateBaseUrl("https://llm.example.com/v1", {
    nodeEnv: "production",
    allowedHosts: ["llm.example.com"],
  });

  assert.equal(url.hostname, "llm.example.com");
});

test("rejects untrusted, insecure, and credential-bearing URLs", () => {
  for (const value of [
    "https://api.groq.com.attacker.example/v1",
    "http://api.example.com/v1",
    "https://user:secret@api.groq.com/v1",
    "https://api.groq.com/v1?redirect=http://localhost",
    "https://169.254.169.254/latest",
  ]) {
    assert.throws(
      () =>
        validateBaseUrl(value, {
          nodeEnv: "production",
          allowedHosts: ["api.example.com"],
        }),
      /unsupported|allowed|valid/,
      value,
    );
  }
});

test("allows loopback Ollama only outside production", () => {
  assert.equal(
    validateBaseUrl("http://localhost:11434/v1", {
      nodeEnv: "development",
    }).hostname,
    "localhost",
  );
  assert.throws(
    () =>
      validateBaseUrl("http://localhost:11434/v1", {
        nodeEnv: "production",
      }),
    /allowed/,
  );
});

test("rejects requests with overlong histories", () => {
  const result = ChatRequestSchema.safeParse({
    apiKey: "test-key",
    baseUrl: "https://api.openai.com/v1",
    model: "test-model",
    systemPrompt: "",
    temperature: 0.7,
    maxTokens: 512,
    messages: [
      { role: "user", content: "a".repeat(20_000) },
      { role: "assistant", content: "b".repeat(20_000) },
      { role: "user", content: "c".repeat(20_000) },
      { role: "assistant", content: "d".repeat(20_000) },
      { role: "user", content: "e".repeat(20_000) },
      { role: "assistant", content: "f".repeat(20_000) },
    ],
  });

  assert.equal(result.success, false);
});
