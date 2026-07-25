import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { serverEnv } from "@/lib/env";
import {
  ASSESSMENT_QUESTIONS,
  scoreByCategory,
} from "@/lib/assessment/questions";
import type { Profile } from "@/types/database";

export interface SummaryResult {
  content: string;
  model: string;
  highlights: string[];
}

interface GenerateSummaryArgs {
  profile: Pick<Profile, "full_name" | "company" | "role" | "primary_goal">;
  answers: Record<string, string>;
  score: number;
}

/**
 * Build a readable, human-friendly description of the answers for the model.
 */
function describeAnswers(answers: Record<string, string>): string {
  return ASSESSMENT_QUESTIONS.map((q) => {
    const option = q.options.find((o) => o.value === answers[q.id]);
    return `- [${q.category}] ${q.prompt}\n  Answer: ${
      option?.label ?? "Not answered"
    }`;
  }).join("\n");
}

/**
 * Derive category highlights (strengths and focus areas) deterministically.
 */
function deriveHighlights(answers: Record<string, string>): string[] {
  const byCategory = scoreByCategory(answers);
  const entries = Object.entries(byCategory).sort((a, b) => b[1] - a[1]);
  const highlights: string[] = [];

  const top = entries[0];
  const bottom = entries[entries.length - 1];

  if (top) highlights.push(`Strongest area: ${top[0]} (${top[1]}/100)`);
  if (bottom && bottom[0] !== top?.[0]) {
    highlights.push(`Biggest opportunity: ${bottom[0]} (${bottom[1]}/100)`);
  }
  for (const [category, value] of entries) {
    if (value < 50 && category !== bottom?.[0]) {
      highlights.push(`Needs attention: ${category} (${value}/100)`);
    }
  }
  return highlights;
}

/**
 * Deterministic, dependency-free summary used when no AI provider is
 * configured. Keeps the product fully functional without an API key.
 */
function localSummary(args: GenerateSummaryArgs): SummaryResult {
  const { profile, answers, score } = args;
  const byCategory = scoreByCategory(answers);
  const name = profile.full_name?.split(" ")[0] ?? "there";

  const band =
    score >= 80
      ? "highly mature"
      : score >= 60
        ? "solid but improvable"
        : score >= 40
          ? "developing"
          : "early-stage";

  const categoryLines = Object.entries(byCategory)
    .sort((a, b) => b[1] - a[1])
    .map(([cat, val]) => `- **${cat}**: ${val}/100`)
    .join("\n");

  const content = `## Readiness summary for ${name}

Based on your responses, your overall readiness score is **${score}/100**, which
places your organisation in the **${band}** range.

${
  profile.primary_goal
    ? `You told us your primary goal is: _"${profile.primary_goal}"_.\n\n`
    : ""
}### Category breakdown
${categoryLines}

### What this means
Your strongest areas give you a foundation to build on, while the lower-scoring
categories represent the fastest paths to measurable improvement. Focus first on
the areas below 50, where small, well-documented changes tend to compound
quickly.

### Recommended next steps
1. Pick the single lowest-scoring category and define one concrete improvement.
2. Add a lightweight metric so progress is visible within two weeks.
3. Re-run this assessment in 30 days to measure movement.`;

  return {
    content,
    model: "local-deterministic",
    highlights: deriveHighlights(answers),
  };
}

/**
 * Generate an AI summary of a completed assessment.
 *
 * Uses Anthropic Claude when `ANTHROPIC_API_KEY` is set; otherwise falls back
 * to a deterministic local generator so the feature always works.
 */
export async function generateSummary(
  args: GenerateSummaryArgs,
): Promise<SummaryResult> {
  const apiKey = serverEnv.anthropicApiKey;
  if (!apiKey) {
    return localSummary(args);
  }

  const model = serverEnv.anthropicModel;
  const highlights = deriveHighlights(args.answers);

  try {
    const client = new Anthropic({ apiKey });

    const prompt = `You are an experienced organisational-readiness consultant.
Write a concise, encouraging, and specific summary (250-350 words, Markdown)
of the following assessment. Use a warm professional tone, avoid jargon, and
end with 3 concrete next steps.

Person: ${args.profile.full_name ?? "Unknown"} — ${args.profile.role ?? "role unknown"} at ${args.profile.company ?? "their company"}
Stated goal: ${args.profile.primary_goal ?? "not provided"}
Overall score: ${args.score}/100

Assessment responses:
${describeAnswers(args.answers)}

Category highlights:
${highlights.map((h) => `- ${h}`).join("\n")}`;

    const message = await client.messages.create({
      model,
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    });

    const content = message.content
      .filter((block): block is Anthropic.TextBlock => block.type === "text")
      .map((block) => block.text)
      .join("\n")
      .trim();

    if (!content) {
      return localSummary(args);
    }

    return { content, model, highlights };
  } catch (error) {
    // Never fail the user flow because of an AI outage — degrade gracefully.
    console.error("AI summary generation failed, using local fallback:", error);
    return localSummary(args);
  }
}
