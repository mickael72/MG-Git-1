import type { Metadata } from "next";
import Link from "next/link";
import { Sparkles, RefreshCw, Download } from "lucide-react";
import { requireUser } from "@/lib/data/user";
import {
  getLatestAssessment,
  getAssessmentById,
  getSummaryForAssessment,
} from "@/lib/data/assessments";
import { regenerateSummary } from "@/app/(app)/actions";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { ScoreRing } from "@/components/app/score-ring";
import { Markdown } from "@/components/app/markdown";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "AI Summary" };

export default async function SummaryPage({
  searchParams,
}: {
  searchParams: Promise<{ assessment?: string }>;
}) {
  const user = await requireUser();
  const { assessment: assessmentId } = await searchParams;

  const assessment = assessmentId
    ? await getAssessmentById(user.id, assessmentId)
    : await getLatestAssessment(user.id);

  if (!assessment) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold tracking-tight">No summary yet</h1>
        <p className="text-muted-foreground">
          Complete the assessment to generate your first AI summary.
        </p>
        <Link href="/assessment" className={buttonVariants()}>
          Take the assessment
        </Link>
      </div>
    );
  }

  const summary = await getSummaryForAssessment(user.id, assessment.id);
  const highlights = Array.isArray(summary?.highlights)
    ? (summary.highlights as string[])
    : [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
            <Sparkles className="h-6 w-6 text-primary" />
            Your AI summary
          </h1>
          <p className="mt-1 text-muted-foreground">
            Generated from your assessment on{" "}
            {formatDate(assessment.completed_at ?? assessment.created_at)}.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <a
            href={`/api/export/obsidian?assessment=${assessment.id}`}
            className={buttonVariants({ variant: "outline" })}
          >
            <Download className="h-4 w-4" />
            Export note
          </a>
          <form action={regenerateSummary}>
            <input type="hidden" name="assessmentId" value={assessment.id} />
            <Button type="submit" variant="outline">
              <RefreshCw className="h-4 w-4" />
              Regenerate
            </Button>
          </form>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-[220px_1fr]">
        <Card>
          <CardContent className="flex flex-col items-center gap-4 pt-6">
            <ScoreRing score={assessment.score ?? 0} />
            {summary?.model && (
              <Badge variant="secondary">
                {summary.model === "local-deterministic"
                  ? "Local model"
                  : summary.model}
              </Badge>
            )}
            {highlights.length > 0 && (
              <ul className="w-full space-y-2 text-sm">
                {highlights.map((h, i) => (
                  <li
                    key={i}
                    className="rounded-md bg-secondary px-3 py-2 text-secondary-foreground"
                  >
                    {h}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Summary</CardTitle>
          </CardHeader>
          <CardContent>
            {summary ? (
              <Markdown content={summary.content} />
            ) : (
              <div className="space-y-4 text-sm text-muted-foreground">
                <p>
                  We couldn&apos;t find a stored summary for this assessment.
                  Generate one now.
                </p>
                <form action={regenerateSummary}>
                  <input
                    type="hidden"
                    name="assessmentId"
                    value={assessment.id}
                  />
                  <Button type="submit">
                    <Sparkles className="h-4 w-4" />
                    Generate summary
                  </Button>
                </form>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div>
        <Link href="/dashboard" className={buttonVariants({ variant: "outline" })}>
          Back to dashboard
        </Link>
      </div>
    </div>
  );
}
