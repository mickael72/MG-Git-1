import type { Metadata } from "next";
import Link from "next/link";
import { requireUser, getProfile } from "@/lib/data/user";
import { AssessmentForm } from "@/components/app/assessment-form";
import { buttonVariants } from "@/components/ui/button";

export const metadata: Metadata = { title: "Assessment" };

export default async function AssessmentPage() {
  const user = await requireUser();
  const profile = await getProfile(user.id);

  // Nudge users to complete onboarding first for a richer summary.
  if (!profile || profile.onboarding_status !== "completed") {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold tracking-tight">
          Finish onboarding first
        </h1>
        <p className="text-muted-foreground">
          Complete your profile so we can personalise your assessment summary.
        </p>
        <Link href="/onboarding" className={buttonVariants()}>
          Go to onboarding
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Readiness assessment
        </h1>
        <p className="mt-1 text-muted-foreground">
          Answer a few questions across four areas. It takes about three
          minutes, and your answers generate an AI summary at the end.
        </p>
      </div>
      <AssessmentForm />
    </div>
  );
}
