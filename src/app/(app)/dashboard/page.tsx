import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  ClipboardList,
  Download,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { requireUser, getProfile } from "@/lib/data/user";
import { listAssessments, getLatestSummary } from "@/lib/data/assessments";
import { scoreByCategory } from "@/lib/assessment/questions";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { ScoreRing } from "@/components/app/score-ring";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const user = await requireUser();
  const [profile, assessments, latestSummary] = await Promise.all([
    getProfile(user.id),
    listAssessments(user.id, 5),
    getLatestSummary(user.id),
  ]);

  const firstName = profile?.full_name?.split(" ")[0] ?? "there";
  const latest = assessments[0];

  // Empty state: no assessment completed yet.
  if (!latest) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Welcome, {firstName}
          </h1>
          <p className="mt-1 text-muted-foreground">
            Let&apos;s get your first readiness score.
          </p>
        </div>
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
            <div className="grid h-12 w-12 place-items-center rounded-full bg-primary/10 text-primary">
              <ClipboardList className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">
                {profile?.onboarding_status === "completed"
                  ? "Take your first assessment"
                  : "Complete onboarding to begin"}
              </h2>
              <p className="mt-1 max-w-md text-sm text-muted-foreground">
                It takes about three minutes and produces an AI-generated
                summary with concrete next steps.
              </p>
            </div>
            <Link
              href={
                profile?.onboarding_status === "completed"
                  ? "/assessment"
                  : "/onboarding"
              }
              className={buttonVariants()}
            >
              {profile?.onboarding_status === "completed"
                ? "Start assessment"
                : "Start onboarding"}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const answers = (latest.answers ?? {}) as Record<string, string>;
  const byCategory = scoreByCategory(answers);
  const previous = assessments[1];
  const delta =
    previous && previous.score != null && latest.score != null
      ? latest.score - previous.score
      : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Welcome back, {firstName}
          </h1>
          <p className="mt-1 text-muted-foreground">
            {profile?.company
              ? `Here's how ${profile.company} is tracking.`
              : "Here's your latest readiness snapshot."}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <a
            href="/api/export/obsidian"
            className={buttonVariants({ variant: "outline" })}
          >
            <Download className="h-4 w-4" />
            Export to Obsidian
          </a>
          <Link href="/assessment" className={buttonVariants()}>
            Retake assessment
          </Link>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Overall readiness</CardTitle>
            <CardDescription>
              Last updated{" "}
              {formatDate(latest.completed_at ?? latest.created_at)}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-3">
            <ScoreRing score={latest.score ?? 0} />
            {delta !== null && (
              <Badge variant={delta >= 0 ? "success" : "warning"}>
                <TrendingUp className="mr-1 h-3 w-3" />
                {delta >= 0 ? "+" : ""}
                {delta} vs previous
              </Badge>
            )}
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Category breakdown</CardTitle>
            <CardDescription>
              Where you&apos;re strong and where to focus.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.entries(byCategory)
              .sort((a, b) => b[1] - a[1])
              .map(([category, value]) => (
                <div key={category} className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">{category}</span>
                    <span className="text-muted-foreground">{value}/100</span>
                  </div>
                  <Progress value={value} />
                </div>
              ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Latest AI summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {latestSummary ? (
              <>
                <p className="line-clamp-4 text-sm text-muted-foreground">
                  {latestSummary.content
                    .replace(/[#*_`>]/g, "")
                    .split("\n")
                    .filter(Boolean)
                    .slice(1, 3)
                    .join(" ")}
                </p>
                <Link
                  href={`/summary?assessment=${latest.id}`}
                  className={buttonVariants({ variant: "outline", size: "sm" })}
                >
                  Read full summary
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">
                No summary generated yet.
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Assessment history</CardTitle>
            <CardDescription>Your recent submissions.</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="divide-y divide-border">
              {assessments.map((a) => (
                <li
                  key={a.id}
                  className="flex items-center justify-between py-3 text-sm"
                >
                  <span className="text-muted-foreground">
                    {formatDate(a.completed_at ?? a.created_at)}
                  </span>
                  <div className="flex items-center gap-3">
                    <span className="font-medium">{a.score ?? 0}/100</span>
                    <Link
                      href={`/summary?assessment=${a.id}`}
                      className="text-primary hover:underline"
                    >
                      View
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
