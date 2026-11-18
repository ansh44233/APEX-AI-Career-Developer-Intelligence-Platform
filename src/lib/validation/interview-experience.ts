import { z } from "zod";

const optionalHttpsUrl = z.string().trim().max(500).url().refine((value) => {
  try { return new URL(value).protocol === "https:"; } catch { return false; }
}).nullable().optional();

export const createInterviewExperienceSchema = z.object({
  company: z.string().trim().min(2).max(120),
  role: z.string().trim().min(2).max(120),
  experienceLevel: z.enum(["Internship", "Entry level / Graduate", "1–3 years", "3–6 years", "6+ years"]),
  roundType: z.enum(["Online assessment", "Technical", "Coding", "System design", "Behavioural / HR", "Managerial", "Other"]),
  difficulty: z.enum(["Easy", "Medium", "Hard", "Mixed", "Not sure"]),
  interviewDate: z.string().date().nullable().optional(),
  questionText: z.string().trim().min(10).max(1200),
  experienceNote: z.string().trim().max(2500).nullable().optional(),
  sourceUrl: optionalHttpsUrl,
  confirmFirsthand: z.literal(true),
}).strict();

export function parseCreateInterviewExperience(input: unknown) {
  return createInterviewExperienceSchema.safeParse(input);
}
