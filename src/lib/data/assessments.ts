import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Assessment, Summary } from "@/types/database";

export async function getLatestAssessment(
  userId: string,
): Promise<Assessment | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("assessments")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data;
}

export async function getAssessmentById(
  userId: string,
  assessmentId: string,
): Promise<Assessment | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("assessments")
    .select("*")
    .eq("user_id", userId)
    .eq("id", assessmentId)
    .maybeSingle();
  return data;
}

export async function listAssessments(
  userId: string,
  limit = 10,
): Promise<Assessment[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("assessments")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);
  return data ?? [];
}

export async function getSummaryForAssessment(
  userId: string,
  assessmentId: string,
): Promise<Summary | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("summaries")
    .select("*")
    .eq("user_id", userId)
    .eq("assessment_id", assessmentId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data;
}

/**
 * All summaries for a user, most recent first. Used by the Obsidian export to
 * pair each assessment with its latest summary.
 */
export async function listSummaries(userId: string): Promise<Summary[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("summaries")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  return data ?? [];
}

export async function getLatestSummary(
  userId: string,
): Promise<Summary | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("summaries")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data;
}
