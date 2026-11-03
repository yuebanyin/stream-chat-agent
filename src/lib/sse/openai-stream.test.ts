import assert from "node:assert/strict";
import test from "node:test";
import { readOpenAIContent } from "./openai-stream";

function createStream(parts: string[]): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  return new ReadableStream({
    start(controller) {
      for (const part of parts) {
        controller.enqueue(encoder.encode(part));
      }
      controller.close();
    },
  });
}

async function collectContent(parts: string[]): Promise<string[]> {
  const content: string[] = [];
  for await (const delta of readOpenAIContent(
    createStream(parts),
    new AbortController().signal,
  )) {
    content.push(delta);
  }
  return content;
}

test("parses provider events split across arbitrary network chunks", async () => {
  const wireText =
    'data: {"choices":[{"delta":{"content":"Hello "}}]}\r\n\r\n' +
    'data: {"choices":[{"delta":{"content":"world"}}]}\n\n' +
    "data: [DONE]\n\n";
  const chunks = [
    wireText.slice(0, 7),
    wireText.slice(7, 29),
    wireText.slice(29, 55),
    wireText.slice(55),
  ];

  assert.deepEqual(await collectContent(chunks), ["Hello ", "world"]);
});

test("ignores usage-only chunks and returns streamed text", async () => {
  const chunks = [
    'data: {"choices":[{"delta":{"content":"A"}}]}\n\n',
    'data: {"choices":[],"usage":{"total_tokens":12}}\n\n',
    'data: {"choices":[{"delta":{"content":"B"}}]}\n\n',
    "data: [DONE]\n\n",
  ];

  assert.deepEqual(await collectContent(chunks), ["A", "B"]);
});

test("rejects malformed JSON in a provider event", async () => {
  await assert.rejects(
    async () => collectContent(['data: {"choices":]\n\n']),
    /invalid streaming response/,
  );
});
