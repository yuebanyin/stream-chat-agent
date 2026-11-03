export type MessageRole = "user" | "assistant" | "system";

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  createdAt: number;
}

export interface ChatSession {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messages: ChatMessage[];
}

export interface ModelSettings {
  apiKey: string;
  baseUrl: string;
  model: string;
  systemPrompt: string;
  temperature: number;
  maxTokens: number;
}

export interface ChatRequest {
  apiKey: string;
  baseUrl: string;
  model: string;
  systemPrompt: string;
  temperature: number;
  maxTokens: number;
  messages: Array<Pick<ChatMessage, "role" | "content">>;
}
