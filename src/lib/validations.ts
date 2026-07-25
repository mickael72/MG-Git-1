import { z } from "zod";
import { ASSESSMENT_QUESTIONS } from "@/lib/assessment/questions";

/**
 * Auth schemas.
 */
export const credentialsSchema = z.object({
  email: z.string().email("Enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export type Credentials = z.infer<typeof credentialsSchema>;

/**
 * Onboarding schema.
 */
export const TEAM_SIZES = ["1-10", "11-50", "51-200", "201-1000", "1000+"] as const;

export const onboardingSchema = z.object({
  fullName: z.string().min(1, "Please enter your name").max(120),
  company: z.string().min(1, "Please enter your company").max(160),
  role: z.string().min(1, "Please enter your role").max(120),
  teamSize: z.enum(TEAM_SIZES, {
    errorMap: () => ({ message: "Select a team size" }),
  }),
  primaryGoal: z
    .string()
    .min(3, "Tell us a little about your goal")
    .max(500),
});

export type OnboardingInput = z.infer<typeof onboardingSchema>;

/**
 * Assessment schema — derived dynamically from the questionnaire definition so
 * it always stays in sync. Every question must be answered with a valid option.
 */
const assessmentShape = ASSESSMENT_QUESTIONS.reduce<
  Record<string, z.ZodTypeAny>
>((shape, question) => {
  const allowed = question.options.map((o) => o.value) as [
    string,
    ...string[],
  ];
  shape[question.id] = z.enum(allowed, {
    errorMap: () => ({ message: "Please choose an option" }),
  });
  return shape;
}, {});

export const assessmentAnswersSchema = z.object(assessmentShape);

export type AssessmentAnswers = z.infer<typeof assessmentAnswersSchema>;
