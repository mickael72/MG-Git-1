import {
  ASSESSMENT_QUESTIONS,
  scoreByCategory,
} from "@/lib/assessment/questions";
import type { Assessment, Profile, Summary } from "@/types/database";
import type { ZipEntry } from "@/lib/zip";

/**
 * Render assessments and AI summaries as an Obsidian-friendly Markdown vault:
 * YAML frontmatter, tags, callouts, tables, and [[wikilinks]] between notes.
 */

const VAULT_DIR = "Readiness";
const INDEX_TITLE = "Readiness — Index";
const INDEX_BASENAME = "Readiness - Index";

function band(score: number): string {
  if (score >= 80) return "highly mature";
  if (score >= 60) return "solid but improvable";
  if (score >= 40) return "developing";
  return "early-stage";
}

/** YYYY-MM-DD in UTC from an ISO timestamp. */
function dateStr(iso: string): string {
  return new Date(iso).toISOString().slice(0, 10);
}

/** Filesystem-safe basename (no extension, no wikilink-hostile chars). */
export function assessmentBasename(assessment: Assessment): string {
  const d = dateStr(assessment.completed_at ?? assessment.created_at);
  const short = assessment.id.slice(0, 8);
  return `Readiness Assessment - ${d} - ${short}`;
}

function frontmatter(fields: Record<string, string | number | string[]>): string {
  const lines = Object.entries(fields).map(([key, value]) => {
    if (Array.isArray(value)) {
      return `${key}: [${value.map((v) => JSON.stringify(v)).join(", ")}]`;
    }
    if (typeof value === "number") return `${key}: ${value}`;
    return `${key}: ${JSON.stringify(value)}`;
  });
  return `---\n${lines.join("\n")}\n---\n`;
}

export function renderAssessmentNote(
  profile: Pick<Profile, "full_name" | "company" | "role"> | null,
  assessment: Assessment,
  summary: Summary | null,
): string {
  const score = assessment.score ?? 0;
  const d = dateStr(assessment.completed_at ?? assessment.created_at);
  const byCategory = scoreByCategory(
    (assessment.answers ?? {}) as Record<string, string>,
  );

  const fm = frontmatter({
    title: `Readiness Assessment ${d}`,
    date: d,
    score,
    band: band(score),
    company: profile?.company ?? "",
    tags: ["readiness", "assessment"],
    aliases: [`Assessment ${d}`],
  });

  const categoryTable = [
    "| Category | Score |",
    "| --- | ---: |",
    ...Object.entries(byCategory)
      .sort((a, b) => b[1] - a[1])
      .map(([cat, val]) => `| ${cat} | ${val}/100 |`),
  ].join("\n");

  const answers = (assessment.answers ?? {}) as Record<string, string>;
  const responses = ASSESSMENT_QUESTIONS.map((q) => {
    const option = q.options.find((o) => o.value === answers[q.id]);
    return `- **${q.prompt}**\n    - _${q.category}_ → ${option?.label ?? "Not answered"}`;
  }).join("\n");

  const highlights = Array.isArray(summary?.highlights)
    ? (summary.highlights as string[])
    : [];

  return `${fm}
# Readiness Assessment — ${d}

> [!info] Overall readiness
> **${score}/100** — ${band(score)}${
    profile?.full_name ? `\n> For ${profile.full_name}` : ""
  }${profile?.company ? ` at ${profile.company}` : ""}

## Category breakdown

${categoryTable}
${
  highlights.length
    ? `\n## Highlights\n\n${highlights.map((h) => `> [!tip] ${h}`).join("\n\n")}\n`
    : ""
}
## AI summary

${summary?.content ?? "_No summary was generated for this assessment._"}

## Responses

${responses}

---

Related: [[${INDEX_BASENAME}]]
`;
}

export function renderIndexNote(
  profile: Pick<Profile, "full_name" | "company"> | null,
  assessments: Assessment[],
): string {
  const fm = frontmatter({
    title: INDEX_TITLE,
    tags: ["readiness", "moc"],
  });

  const list = assessments
    .map((a) => {
      const d = dateStr(a.completed_at ?? a.created_at);
      return `- [[${assessmentBasename(a)}|${d}]] — **${a.score ?? 0}/100**`;
    })
    .join("\n");

  const latest = assessments[0];

  return `${fm}
# ${INDEX_TITLE}

${profile?.full_name ? `**${profile.full_name}**` : "Readiness"}${
    profile?.company ? ` · ${profile.company}` : ""
  }

> [!abstract] Map of content
> This note links every readiness assessment exported from the app.${
    latest ? ` Latest score: **${latest.score ?? 0}/100**.` : ""
  }

## Assessments

${list || "_No assessments yet._"}
`;
}

/**
 * Build the full Obsidian vault as a set of zip entries (an index note plus one
 * note per assessment).
 */
export function buildObsidianVault(
  profile: Pick<Profile, "full_name" | "company" | "role"> | null,
  assessments: Assessment[],
  summaryByAssessment: Map<string, Summary>,
): ZipEntry[] {
  const entries: ZipEntry[] = [
    {
      path: `${VAULT_DIR}/${INDEX_BASENAME}.md`,
      content: renderIndexNote(profile, assessments),
    },
  ];

  for (const assessment of assessments) {
    entries.push({
      path: `${VAULT_DIR}/${assessmentBasename(assessment)}.md`,
      content: renderAssessmentNote(
        profile,
        assessment,
        summaryByAssessment.get(assessment.id) ?? null,
      ),
    });
  }

  return entries;
}
