import { z } from "zod";
import { isApexToolId } from "@/lib/agent/tools";

export const executeAgentToolSchema = z.object({
  toolId: z.string().refine(isApexToolId, "Choose an available APEX tool."),
  input: z.string().max(5_000),
  approved: z.literal(true),
}).strict();

export const parseExecuteAgentTool = (input: unknown) => executeAgentToolSchema.safeParse(input);
