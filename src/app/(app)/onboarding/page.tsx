import type { Metadata } from "next";
import { requireUser, getProfile } from "@/lib/data/user";
import { OnboardingForm } from "@/components/app/onboarding-form";
import { Card, CardContent } from "@/components/ui/card";

export const metadata: Metadata = { title: "Onboarding" };

export default async function OnboardingPage() {
  const user = await requireUser();
  const profile = await getProfile(user.id);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Let&apos;s set up your workspace
        </h1>
        <p className="mt-1 text-muted-foreground">
          Tell us a bit about you so we can tailor your assessment and summary.
        </p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <OnboardingForm profile={profile} />
        </CardContent>
      </Card>
    </div>
  );
}
