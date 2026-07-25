/**
 * Definition of the assessment questionnaire.
 *
 * The questionnaire is a "readiness" assessment: a set of weighted,
 * multiple-choice questions grouped into categories. Each option carries a
 * numeric value used to compute a normalised 0-100 score.
 *
 * This is the single source of truth consumed by both the UI (rendering) and
 * the scoring/validation logic (server-side). Changing it automatically
 * updates the questionnaire and the Zod schema derived from it.
 */

export interface AssessmentOption {
  value: string;
  label: string;
  /** Points contributed toward the category max when selected. */
  score: number;
}

export interface AssessmentQuestion {
  id: string;
  category: string;
  prompt: string;
  helpText?: string;
  options: AssessmentOption[];
}

export const ASSESSMENT_QUESTIONS: readonly AssessmentQuestion[] = [
  {
    id: "strategy_clarity",
    category: "Strategy",
    prompt: "How clearly defined is your team's primary objective this quarter?",
    helpText: "Think about whether everyone could state the goal the same way.",
    options: [
      { value: "very_clear", label: "Crystal clear and shared by all", score: 4 },
      { value: "mostly_clear", label: "Mostly clear, minor gaps", score: 3 },
      { value: "somewhat", label: "Somewhat clear, but interpretations vary", score: 2 },
      { value: "unclear", label: "Unclear or frequently shifting", score: 1 },
    ],
  },
  {
    id: "strategy_metrics",
    category: "Strategy",
    prompt: "Do you track measurable metrics tied to that objective?",
    options: [
      { value: "automated", label: "Yes, tracked automatically in dashboards", score: 4 },
      { value: "manual", label: "Yes, but tracked manually", score: 3 },
      { value: "ad_hoc", label: "Occasionally / ad hoc", score: 2 },
      { value: "none", label: "No consistent metrics", score: 1 },
    ],
  },
  {
    id: "process_docs",
    category: "Process",
    prompt: "How well are your core workflows documented?",
    options: [
      { value: "living_docs", label: "Living docs kept up to date", score: 4 },
      { value: "some_docs", label: "Documented but sometimes stale", score: 3 },
      { value: "tribal", label: "Mostly tribal knowledge", score: 2 },
      { value: "none", label: "Not documented", score: 1 },
    ],
  },
  {
    id: "process_automation",
    category: "Process",
    prompt: "How much of your repetitive work is automated?",
    options: [
      { value: "high", label: "Most repetitive work is automated", score: 4 },
      { value: "medium", label: "Some automation in place", score: 3 },
      { value: "low", label: "Very little automation", score: 2 },
      { value: "none", label: "Everything is manual", score: 1 },
    ],
  },
  {
    id: "team_collab",
    category: "Team",
    prompt: "How effective is cross-functional collaboration?",
    options: [
      { value: "excellent", label: "Seamless across functions", score: 4 },
      { value: "good", label: "Generally good", score: 3 },
      { value: "siloed", label: "Somewhat siloed", score: 2 },
      { value: "poor", label: "Frequent friction / handoff issues", score: 1 },
    ],
  },
  {
    id: "team_feedback",
    category: "Team",
    prompt: "How regularly does your team review and act on feedback?",
    options: [
      { value: "continuous", label: "Continuous, built into cadence", score: 4 },
      { value: "monthly", label: "On a regular cadence", score: 3 },
      { value: "rarely", label: "Rarely / only when problems arise", score: 2 },
      { value: "never", label: "Almost never", score: 1 },
    ],
  },
  {
    id: "tech_tooling",
    category: "Technology",
    prompt: "How well does your tooling support your workflows today?",
    options: [
      { value: "great", label: "Tools fit our needs well", score: 4 },
      { value: "adequate", label: "Adequate with some gaps", score: 3 },
      { value: "strained", label: "Strained / workarounds common", score: 2 },
      { value: "blocking", label: "Tooling actively blocks us", score: 1 },
    ],
  },
  {
    id: "tech_data",
    category: "Technology",
    prompt: "How confident are you in the quality of your data?",
    options: [
      { value: "high", label: "High — trusted and clean", score: 4 },
      { value: "medium", label: "Medium — mostly reliable", score: 3 },
      { value: "low", label: "Low — frequent inconsistencies", score: 2 },
      { value: "none", label: "We don't really trust our data", score: 1 },
    ],
  },
] as const;

/** Maximum score achievable per question. */
export const MAX_SCORE_PER_QUESTION = 4;

export const ASSESSMENT_CATEGORIES = Array.from(
  new Set(ASSESSMENT_QUESTIONS.map((q) => q.category)),
);

/**
 * Compute a normalised 0-100 score from a map of answers.
 * Unanswered or invalid questions contribute 0.
 */
export function scoreAssessment(answers: Record<string, string>): number {
  const maxTotal = ASSESSMENT_QUESTIONS.length * MAX_SCORE_PER_QUESTION;
  let total = 0;

  for (const question of ASSESSMENT_QUESTIONS) {
    const selected = answers[question.id];
    const option = question.options.find((o) => o.value === selected);
    if (option) total += option.score;
  }

  return Math.round((total / maxTotal) * 100);
}

/**
 * Per-category breakdown as normalised 0-100 scores. Useful for the dashboard.
 */
export function scoreByCategory(
  answers: Record<string, string>,
): Record<string, number> {
  const result: Record<string, number> = {};

  for (const category of ASSESSMENT_CATEGORIES) {
    const questions = ASSESSMENT_QUESTIONS.filter(
      (q) => q.category === category,
    );
    const max = questions.length * MAX_SCORE_PER_QUESTION;
    let total = 0;
    for (const q of questions) {
      const option = q.options.find((o) => o.value === answers[q.id]);
      if (option) total += option.score;
    }
    result[category] = max === 0 ? 0 : Math.round((total / max) * 100);
  }

  return result;
}
