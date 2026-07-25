"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { saveOnboarding, type ActionState } from "@/app/(app)/actions";
import { TEAM_SIZES } from "@/lib/validations";
import type { Profile } from "@/types/database";

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="text-xs text-destructive">{message}</p>;
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" disabled={pending}>
      {pending && <Loader2 className="h-4 w-4 animate-spin" />}
      Continue to assessment
    </Button>
  );
}

export function OnboardingForm({ profile }: { profile: Profile | null }) {
  const [state, formAction] = useActionState<ActionState, FormData>(
    saveOnboarding,
    {},
  );
  const errors = state.fieldErrors ?? {};

  return (
    <form action={formAction} className="space-y-6">
      <div className="grid gap-6 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="fullName">Full name</Label>
          <Input
            id="fullName"
            name="fullName"
            defaultValue={profile?.full_name ?? ""}
            placeholder="Ada Lovelace"
            required
          />
          <FieldError message={errors.fullName} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="company">Company</Label>
          <Input
            id="company"
            name="company"
            defaultValue={profile?.company ?? ""}
            placeholder="Acme Inc."
            required
          />
          <FieldError message={errors.company} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="role">Your role</Label>
          <Input
            id="role"
            name="role"
            defaultValue={profile?.role ?? ""}
            placeholder="Head of Operations"
            required
          />
          <FieldError message={errors.role} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="teamSize">Team size</Label>
          <select
            id="teamSize"
            name="teamSize"
            defaultValue={profile?.team_size ?? ""}
            required
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <option value="" disabled>
              Select…
            </option>
            {TEAM_SIZES.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
          <FieldError message={errors.teamSize} />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="primaryGoal">What&apos;s your primary goal right now?</Label>
        <Textarea
          id="primaryGoal"
          name="primaryGoal"
          defaultValue={profile?.primary_goal ?? ""}
          placeholder="e.g. Improve delivery predictability and reduce manual work."
          rows={3}
          required
        />
        <FieldError message={errors.primaryGoal} />
      </div>

      {state.error && (
        <div className="flex items-start gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{state.error}</span>
        </div>
      )}

      <SubmitButton />
    </form>
  );
}
