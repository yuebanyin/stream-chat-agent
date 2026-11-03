import { z } from "zod";

const ChatMessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().trim().min(1).max(20_000),
});

export const ChatRequestSchema = z
  .object({
    apiKey: z.string().trim().min(1).max(4_096),
    baseUrl: z.string().trim().min(1).max(2_048),
    model: z.string().trim().min(1).max(200),
    systemPrompt: z.string().max(12_000),
    temperature: z.number().min(0).max(2),
    maxTokens: z.number().int().min(1).max(16_384),
    messages: z.array(ChatMessageSchema).min(1).max(100),
  })
  .superRefine(({ messages, systemPrompt }, context) => {
    const totalCharacters =
      messages.reduce((total, message) => total + message.content.length, 0) +
      systemPrompt.length;

    if (totalCharacters > 100_000) {
      context.addIssue({
        code: "custom",
        message:
          "The conversation is too long. Start a new chat or shorten it.",
        path: ["messages"],
      });
    }
  });

const BUILT_IN_HOSTS = new Set([
  "api.groq.com",
  "api.openai.com",
  "openrouter.ai",
]);

export function validateBaseUrl(
  value: string,
  options: { nodeEnv?: string; allowedHosts?: string[] } = {},
): URL {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error("Enter a valid model API base URL.");
  }

  const host = url.hostname.toLowerCase().replace(/\.$/, "");
  const isLocalHost = host === "localhost" || host === "127.0.0.1";
  const isDevelopment = options.nodeEnv !== "production";

  if (
    url.username ||
    url.password ||
    url.search ||
    url.hash ||
    url.pathname.includes("..")
  ) {
    throw new Error("The model API base URL contains unsupported parts.");
  }

  if (isLocalHost && isDevelopment && url.protocol === "http:") {
    url.hostname = host;
    return url;
  }

  const allowedHosts = new Set([
    ...BUILT_IN_HOSTS,
    ...(options.allowedHosts ?? [])
      .map((allowedHost) => allowedHost.trim().toLowerCase())
      .filter(Boolean),
  ]);

  if (url.protocol !== "https:" || !allowedHosts.has(host)) {
    throw new Error(
      "This model host is not allowed. Configure LLM_ALLOWED_HOSTS on the server for a trusted provider.",
    );
  }

  url.hostname = host;
  return url;
}

export function getAllowedModelHosts(): string[] {
  return (process.env.LLM_ALLOWED_HOSTS ?? "")
    .split(",")
    .map((host) => host.trim())
    .filter(Boolean);
}

export function getChatCompletionsUrl(baseUrl: URL): URL {
  const endpoint = new URL(baseUrl);
  endpoint.pathname = `${endpoint.pathname.replace(/\/+$/, "")}/chat/completions`;
  return endpoint;
}
