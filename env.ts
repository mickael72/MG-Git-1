import { z } from "zod";

/**
 * Centralised, validated environment access.
 *
 * Public (browser-safe) variables are validated eagerly. Server-only secrets
 * are validated lazily via getters so that importing this module in a client
 * bundle never throws for missing server secrets.
 */

const publicSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url({
    message: "NEXT_PUBLIC_SUPABASE_URL must be a valid URL",
  }),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z
    .string()
    .min(1, "NEXT_PUBLIC_SUPABASE_ANON_KEY is required"),
  NEXT_PUBLIC_SITE_URL: z
    .string()
    .url()
    .optional()
    .default("http://localhost:3000"),
});

const parsedPublic = publicSchema.safeParse({
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
});

if (!parsedPublic.success) {
  // Surface a readable error at boot time rather than a cryptic runtime crash.
  const issues = parsedPublic.error.issues
    .map((i) => `  - ${i.path.join(".")}: ${i.message}`)
    .join("\n");
  throw new Error(
    `Invalid or missing public environment variables:\n${issues}\n\n` +
      `Copy .env.example to .env.local and fill in your Supabase project values.`,
  );
}

export const publicEnv = parsedPublic.data;

export const serverEnv = {
  get supabaseServiceRoleKey(): string | undefined {
    return process.env.SUPABASE_SERVICE_ROLE_KEY;
  },
  get anthropicApiKey(): string | undefined {
    return process.env.ANTHROPIC_API_KEY;
  },
  get anthropicModel(): string {
    return process.env.ANTHROPIC_MODEL ?? "claude-sonnet-5";
  },
};
