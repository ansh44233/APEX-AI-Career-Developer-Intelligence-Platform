import "server-only";

export type AgentMessage = { role: "system" | "user" | "assistant"; content: string };
type ChatCompletionResponse = { choices?: Array<{ message?: { content?: string | null } }> };

function getProviderConfig() {
  const apiKey = process.env.AI_API_KEY;
  const model = process.env.AI_MODEL;
  const baseUrl = (process.env.AI_BASE_URL ?? "https://api.openai.com/v1").replace(/\/+$/, "");
  if (!apiKey || !model) throw new Error("AI_PROVIDER_NOT_CONFIGURED");
  let parsed: URL;
  try { parsed = new URL(baseUrl); } catch { throw new Error("AI_PROVIDER_CONFIGURATION_INVALID"); }
  const localHost = ["localhost", "127.0.0.1", "::1"].includes(parsed.hostname);
  if (parsed.protocol !== "https:" && !(process.env.NODE_ENV !== "production" && localHost && parsed.protocol === "http:")) {
    throw new Error("AI_PROVIDER_CONFIGURATION_INVALID");
  }
  return { apiKey, model, endpoint: `${baseUrl}/chat/completions` };
}

export async function generateAgentReply(messages: AgentMessage[]): Promise<string> {
  const config = getProviderConfig();
  const response = await fetch(config.endpoint, {
    method: "POST",
    headers: { Authorization: `Bearer ${config.apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: config.model, messages, temperature: 0.3, max_tokens: 1200 }),
    signal: AbortSignal.timeout(30_000),
    cache: "no-store",
  });
  const payload = (await response.json().catch(() => null)) as ChatCompletionResponse | null;
  if (!response.ok) throw new Error("AI_PROVIDER_REQUEST_FAILED");
  const content = payload?.choices?.[0]?.message?.content?.trim();
  if (!content) throw new Error("AI_PROVIDER_EMPTY_RESPONSE");
  return content.slice(0, 12_000);
}
