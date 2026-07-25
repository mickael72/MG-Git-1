"use client";

import { useMemo, useState } from "react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { AlertCircle, ArrowLeft, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import {
  ASSESSMENT_CATEGORIES,
  ASSESSMENT_QUESTIONS,
} from "@/lib/assessment/questions";
import { submitAssessment, type ActionState } from "@/app/(app)/actions";

function SubmitButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" disabled={disabled || pending}>
      {pending && <Loader2 className="h-4 w-4 animate-spin" />}
      {pending ? "Generating your summary…" : "Submit & generate summary"}
    </Button>
  );
}

export function AssessmentForm() {
  const [state, formAction] = useActionState<ActionState, FormData>(
    submitAssessment,
    {},
  );
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [step, setStep] = useState(0);

  const categories = ASSESSMENT_CATEGORIES;
  const currentCategory = categories[step]!;
  const questionsForStep = useMemo(
    () => ASSESSMENT_QUESTIONS.filter((q) => q.category === currentCategory),
    [currentCategory],
  );

  const totalAnswered = Object.keys(answers).length;
  const totalQuestions = ASSESSMENT_QUESTIONS.length;
  const progress = Math.round((totalAnswered / totalQuestions) * 100);
  const isLastStep = step === categories.length - 1;

  const stepComplete = questionsForStep.every((q) => answers[q.id]);
  const allComplete = totalAnswered === totalQuestions;

  function select(questionId: string, value: string) {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  }

  return (
    <form action={formAction} className="space-y-6">
      {/* Hidden inputs carry every answer so the server action receives them
          regardless of which step is visible. */}
      {Object.entries(answers).map(([id, value]) => (
        <input key={id} type="hidden" name={id} value={value} />
      ))}

      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium">
            Step {step + 1} of {categories.length} · {currentCategory}
          </span>
          <span className="text-muted-foreground">
            {totalAnswered}/{totalQuestions} answered
          </span>
        </div>
        <Progress value={progress} />
      </div>

      <div className="space-y-4">
        {questionsForStep.map((question) => (
          <Card key={question.id}>
            <CardContent className="space-y-4 pt-6">
              <div>
                <p className="font-medium">{question.prompt}</p>
                {question.helpText && (
                  <p className="mt-1 text-sm text-muted-foreground">
                    {question.helpText}
                  </p>
                )}
              </div>
              <div className="grid gap-2">
                {question.options.map((option) => {
                  const selected = answers[question.id] === option.value;
                  return (
                    <label
                      key={option.value}
                      className={cn(
                        "flex cursor-pointer items-center gap-3 rounded-md border p-3 text-sm transition-colors",
                        selected
                          ? "border-primary bg-primary/5"
                          : "border-border hover:bg-accent",
                      )}
                    >
                      <input
                        type="radio"
                        name={`ui_${question.id}`}
                        value={option.value}
                        checked={selected}
                        onChange={() => select(question.id, option.value)}
                        className="h-4 w-4 accent-[hsl(var(--primary))]"
                      />
                      <span>{option.label}</span>
                    </label>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {state.error && (
        <div className="flex items-start gap-2 rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{state.error}</span>
        </div>
      )}

      <div className="flex items-center justify-between">
        <Button
          type="button"
          variant="outline"
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          disabled={step === 0}
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>

        {isLastStep ? (
          <SubmitButton disabled={!allComplete} />
        ) : (
          <Button
            type="button"
            onClick={() => setStep((s) => Math.min(categories.length - 1, s + 1))}
            disabled={!stepComplete}
          >
            Next
            <ArrowRight className="h-4 w-4" />
          </Button>
        )}
      </div>
    </form>
  );
}
