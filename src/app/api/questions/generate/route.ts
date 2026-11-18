import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUserId } from "@/lib/auth/session";
import { enforceUserRateLimit } from "@/lib/rate-limit";
import { generateAgentReply } from "@/lib/agent/provider";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const requestSchema = z.object({
  role: z.string().trim().min(2).max(80),
  company: z.string().trim().max(80).optional(),
  categories: z.array(z.enum(["DSA", "JavaScript", "React", "Backend & APIs", "Databases & SQL", "CS Fundamentals", "System Design", "Project Defense", "Behavioural"])).min(1).max(9),
  difficulty: z.enum(["All", "Easy", "Medium", "Hard"]),
  count: z.number().int().min(1).max(5).default(5),
});

const questionSchema = z.object({
  title: z.string().trim().min(4).max(120),
  category: z.enum(["DSA", "JavaScript", "React", "Backend & APIs", "Databases & SQL", "CS Fundamentals", "System Design", "Project Defense", "Behavioural"]),
  difficulty: z.enum(["Easy", "Medium", "Hard"]),
  prompt: z.string().trim().min(30).max(900),
  followUp: z.string().trim().min(15).max(400),
  topics: z.array(z.string().trim().min(1).max(40)).min(1).max(5),
  evaluation: z.array(z.string().trim().min(1).max(160)).min(2).max(5),
  hint: z.string().trim().min(15).max(350),
});

const responseSchema = z.object({ questions: z.array(questionSchema).min(1).max(5) });

function parseJson(text: string): unknown {
  const cleaned = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  return JSON.parse(cleaned);
}

export async function POST(request: NextRequest) {
  const userId = await getCurrentUserId().catch(() => null);
  if (!userId) return NextResponse.json({ error: "Sign in to generate more questions." }, { status: 401 });

  const limited = await enforceUserRateLimit(userId, "question-generation", 12, 60 * 60);
  if (limited) return limited;

  let raw: unknown;
  try { raw = await request.json(); }
  catch { return NextResponse.json({ error: "Request body must be valid JSON." }, { status: 400 }); }

  const parsed = requestSchema.safeParse(raw);
  if (!parsed.success) return NextResponse.json({ error: "Choose a valid role, category and difficulty." }, { status: 400 });

  const { role, company, categories, difficulty, count } = parsed.data;
  const system = [
    "You create original, high-quality software engineering interview practice questions.",
    "Return only valid JSON with exactly one key: questions. No markdown fences or commentary.",
    "Each question must have title, category, difficulty, prompt, followUp, topics, evaluation and hint.",
    "Use only the categories supplied in the request. Do not create questions outside that list.",
    "Create distinct questions with different underlying concepts. Avoid trivial paraphrases and duplicates.",
    "Prompts must be self-contained and fair for the requested role and difficulty.",
    "Do not claim questions are actual, leaked, verified, or frequently asked by the named employer. Company context is only a preparation lens.",
    "Evaluation points should describe observable qualities of a strong answer. Hints should nudge without giving away a complete solution.",
    "Return the requested number of questions where possible."
  ].join(" ");
  const user = JSON.stringify({ role, company: company ?? "General practice", categories, difficulty, count });

  try {
    const generated = await generateAgentReply([
      { role: "system", content: system },
      { role: "user", content: user },
    ]);
    let data: unknown;
    try { data = parseJson(generated); }
    catch { return NextResponse.json({ error: "The question provider returned an unreadable response. Please try again." }, { status: 502 }); }
    const validated = responseSchema.safeParse(data);
    if (!validated.success || validated.data.questions.some((item) => !categories.includes(item.category))) return NextResponse.json({ error: "The generated questions did not pass quality checks. Please try again." }, { status: 502 });

    const questions = validated.data.questions.slice(0, count).map((item) => ({
      ...item,
      id: `generated-${crypto.randomUUID()}`,
    }));
    return NextResponse.json({ questions, generatedCount: questions.length }, {
      status: 200,
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message === "AI_PROVIDER_NOT_CONFIGURED") {
      return NextResponse.json({ error: "AI question generation is not enabled yet. Configure AI_BASE_URL, AI_API_KEY and AI_MODEL in Vercel to unlock fresh question batches." }, { status: 503 });
    }
    if (message === "AI_PROVIDER_CONFIGURATION_INVALID") {
      return NextResponse.json({ error: "The AI provider configuration is invalid. Review the server-side provider settings." }, { status: 503 });
    }
    return NextResponse.json({ error: "The AI provider could not generate questions right now. Please try again later." }, { status: 502 });
  }
}
