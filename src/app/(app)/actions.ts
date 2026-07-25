"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireUser } from "@/lib/data/user";
import { onboardingSchema, assessmentAnswersSchema } from "@/lib/validations";
import { scoreAssessment } from "@/lib/assessment/questions";
import { generateSummary } from "@/lib/ai/summary";

export interface ActionState {
  error?: string;
  fieldErrors?: Record<string, string>;
}

/**
 * Persist onboarding details and mark onboarding complete.
 */
export async function saveOnboarding(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();

  const parsed = onboardingSchema.safeParse({
    fullName: formData.get("fullName"),
    company: formData.get("company"),
    role: formData.get("role"),
    teamSize: formData.get("teamSize"),
    primaryGoal: formData.get("primaryGoal"),
  });

  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0];
      if (typeof key === "string" && !fieldErrors[key]) {
        fieldErrors[key] = issue.message;
      }
    }
    return { error: "Please fix the highlighted fields.", fieldErrors };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("profiles").upsert({
    id: user.id,
    email: user.email ?? null,
    full_name: parsed.data.fullName,
    company: parsed.data.company,
    role: parsed.data.role,
    team_size: parsed.data.teamSize,
    primary_goal: parsed.data.primaryGoal,
    onboarding_status: "completed",
    updated_at: new Date().toISOString(),
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/", "layout");
  redirect("/assessment");
}

/**
 * Persist assessment answers, compute the score, generate an AI summary, and
 * store it. Redirects to the summary page on success.
 */
export async function submitAssessment(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireUser();

  const raw: Record<string, FormDataEntryValue | null> = {};
  for (const [key, value] of formData.entries()) {
    raw[key] = value;
  }

  const parsed = assessmentAnswersSchema.safeParse(raw);
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0];
      if (typeof key === "string" && !fieldErrors[key]) {
        fieldErrors[key] = issue.message;
      }
    }
    return {
      error: "Please answer every question before submitting.",
      fieldErrors,
    };
  }

  const answers = parsed.data as Record<string, string>;
  const score = scoreAssessment(answers);

  const supabase = await createClient();

  // Store the assessment.
  const { data: assessment, error: assessmentError } = await supabase
    .from("assessments")
    .insert({
      user_id: user.id,
      answers,
      score,
      completed_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (assessmentError || !assessment) {
    return {
      error: assessmentError?.message ?? "Could not save your assessment.",
    };
  }

  // Load profile context for a richer summary (best-effort).
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, company, role, primary_goal")
    .eq("id", user.id)
    .maybeSingle();

  const summary = await generateSummary({
    profile: profile ?? {
      full_name: null,
      company: null,
      role: null,
      primary_goal: null,
    },
    answers,
    score,
  });

  const { error: summaryError } = await supabase.from("summaries").insert({
    user_id: user.id,
    assessment_id: assessment.id,
    content: summary.content,
    model: summary.model,
    highlights: summary.highlights,
  });

  if (summaryError) {
    // The assessment is saved; surface a soft error but continue to summary.
    console.error("Failed to store summary:", summaryError.message);
  }

  revalidatePath("/", "layout");
  redirect(`/summary?assessment=${assessment.id}`);
}

/**
 * Regenerate the AI summary for an existing assessment. Bound to a form with a
 * hidden `assessmentId` field on the summary page.
 */
export async function regenerateSummary(formData: FormData): Promise<void> {
  const user = await requireUser();
  const assessmentId = String(formData.get("assessmentId") ?? "");
  if (!assessmentId) return;

  const supabase = await createClient();

  const { data: assessment } = await supabase
    .from("assessments")
    .select("id, answers, score")
    .eq("user_id", user.id)
    .eq("id", assessmentId)
    .maybeSingle();

  if (!assessment) return;

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, company, role, primary_goal")
    .eq("id", user.id)
    .maybeSingle();

  const answers = (assessment.answers ?? {}) as Record<string, string>;
  const summary = await generateSummary({
    profile: profile ?? {
      full_name: null,
      company: null,
      role: null,
      primary_goal: null,
    },
    answers,
    score: assessment.score ?? 0,
  });

  await supabase.from("summaries").insert({
    user_id: user.id,
    assessment_id: assessment.id,
    content: summary.content,
    model: summary.model,
    highlights: summary.highlights,
  });

  revalidatePath("/summary");
  redirect(`/summary?assessment=${assessment.id}`);
}
