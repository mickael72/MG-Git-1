import { NextResponse, type NextRequest } from "next/server";
import { getCurrentUser, getProfile } from "@/lib/data/user";
import {
  listAssessments,
  listSummaries,
  getAssessmentById,
  getSummaryForAssessment,
} from "@/lib/data/assessments";
import {
  buildObsidianVault,
  renderAssessmentNote,
  assessmentBasename,
} from "@/lib/obsidian/export";
import { createZip } from "@/lib/zip";
import type { Summary } from "@/types/database";

export const dynamic = "force-dynamic";

/**
 * Export the user's readiness data as Obsidian-flavoured Markdown.
 *
 *   GET /api/export/obsidian                 → full vault as a .zip
 *   GET /api/export/obsidian?assessment=<id> → a single note as .md
 *
 * Auth is enforced here; the query is always scoped to the current user so a
 * user can only ever export their own data.
 */
export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const profile = await getProfile(user.id);
  const assessmentId = request.nextUrl.searchParams.get("assessment");

  // Single-note export.
  if (assessmentId) {
    const assessment = await getAssessmentById(user.id, assessmentId);
    if (!assessment) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    const summary = await getSummaryForAssessment(user.id, assessment.id);
    const markdown = renderAssessmentNote(profile, assessment, summary);
    const filename = `${assessmentBasename(assessment)}.md`;

    return new NextResponse(markdown, {
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  }

  // Full vault export.
  const [assessments, summaries] = await Promise.all([
    listAssessments(user.id, 1000),
    listSummaries(user.id),
  ]);

  if (assessments.length === 0) {
    return NextResponse.json(
      { error: "No assessments to export yet." },
      { status: 404 },
    );
  }

  // Pair each assessment with its most recent summary (summaries are ordered
  // newest-first, so the first one seen per assessment wins).
  const summaryByAssessment = new Map<string, Summary>();
  for (const summary of summaries) {
    if (!summaryByAssessment.has(summary.assessment_id)) {
      summaryByAssessment.set(summary.assessment_id, summary);
    }
  }

  const entries = buildObsidianVault(profile, assessments, summaryByAssessment);
  const zip = createZip(entries);

  return new NextResponse(zip as BodyInit, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="readiness-obsidian-vault.zip"`,
      "Content-Length": String(zip.length),
    },
  });
}
