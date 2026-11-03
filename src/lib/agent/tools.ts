import type { z } from "zod";

export interface AgentTool<TParameters extends z.ZodType = z.ZodType> {
  name: string;
  description: string;
  parameters: TParameters;
  execute: (
    input: z.output<TParameters>,
    signal: AbortSignal,
  ) => Promise<unknown>;
}

export type AgentToolRegistry = readonly AgentTool[];

export const agentTools: AgentToolRegistry = [];
