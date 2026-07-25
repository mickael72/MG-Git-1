# Readiness — Next.js SaaS starter

A production-grade SaaS application built with **Next.js (App Router)**,
**Supabase** (authentication + Postgres), and an **AI summary** feature powered
by Claude. It ships four core flows:

1. **Onboarding** — collect profile + goals.
2. **Assessment questionnaire** — a multi-step, weighted readiness survey.
3. **AI summary** — an LLM-generated, personalised summary with next steps.
4. **Dashboard** — score, category breakdown, history and quick links.

Designed to deploy to **Vercel** with **GitHub** for CI/CD.

---

## Architecture

```
src/
├── app/
│   ├── (auth)/               # login, signup, auth callback, auth actions
│   ├── (app)/                # protected app shell + pages + server actions
│   │   ├── onboarding/
│   │   ├── assessment/
│   │   ├── summary/
│   │   └── dashboard/
│   ├── layout.tsx            # root layout, fonts, metadata
│   ├── page.tsx              # marketing landing page
│   └── globals.css
├── components/
│   ├── ui/                   # design-system primitives (button, card, …)
│   ├── auth/                 # auth form
│   └── app/                  # feature components (forms, charts, markdown)
├── lib/
│   ├── supabase/             # browser / server / middleware clients
│   ├── data/                 # typed data-access layer (server-only)
│   ├── ai/                   # AI summary generation (+ deterministic fallback)
│   ├── assessment/           # questionnaire definition + scoring
│   ├── validations.ts        # Zod schemas (derived from questionnaire)
│   ├── env.ts                # validated environment access
│   └── utils.ts
├── types/database.ts         # typed Supabase schema
└── middleware.ts             # session refresh + route protection
supabase/migrations/          # SQL schema, RLS policies, triggers
```

### Key design decisions

- **Auth via `@supabase/ssr`** with a middleware that refreshes the session on
  every request and enforces route access. Server code always uses
  `getUser()` (revalidates the token) — never `getSession()`.
- **Row Level Security** on every table so a user can only ever read/write
  their own rows. See `supabase/migrations/0001_init.sql`.
- **Server Actions** for all mutations (onboarding, assessment, summary) with
  Zod validation on the server.
- **Typed data-access layer** (`src/lib/data`) keeps Supabase queries in one
  place and out of components.
- **Graceful AI degradation** — if `ANTHROPIC_API_KEY` is not set, a
  deterministic local generator produces a real summary, so the product works
  end-to-end without any AI provider.

---

## Prerequisites

- Node.js ≥ 20
- A [Supabase](https://supabase.com) project
- (Optional) An [Anthropic](https://console.anthropic.com) API key for AI
  summaries

## Local setup

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env.local
#   Fill in NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY
#   (Supabase → Project Settings → API)

# 3. Apply the database schema
#   Paste supabase/migrations/0001_init.sql into the Supabase SQL editor,
#   or use the Supabase CLI:
#     supabase db push

# 4. Run the dev server
npm run dev
```

Open <http://localhost:3000>.

### Environment variables

| Variable                        | Required | Description                                      |
| ------------------------------- | -------- | ------------------------------------------------ |
| `NEXT_PUBLIC_SUPABASE_URL`      | ✅       | Supabase project URL                             |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅       | Supabase anon/public key                         |
| `NEXT_PUBLIC_SITE_URL`          | ✅       | Public base URL (auth redirects)                 |
| `SUPABASE_SERVICE_ROLE_KEY`     | ⛔       | Server-only; reserved for privileged tasks       |
| `ANTHROPIC_API_KEY`             | ⛔       | Enables real AI summaries (falls back if unset)  |
| `ANTHROPIC_MODEL`               | ⛔       | Overrides the Claude model (default sensible)    |

### Supabase Auth configuration

In **Supabase → Authentication → URL Configuration**, add your site URL and the
redirect URL `<site-url>/auth/callback`. For local development, disabling
"Confirm email" gives an instant session on sign up.

---

## Scripts

| Command             | Description                       |
| ------------------- | --------------------------------- |
| `npm run dev`       | Start the dev server              |
| `npm run build`     | Production build                  |
| `npm run start`     | Serve the production build        |
| `npm run lint`      | ESLint                            |
| `npm run typecheck` | TypeScript, no emit               |

---

## Deploying to Vercel

1. Push this repository to GitHub.
2. Import the repo in Vercel (framework auto-detected as Next.js).
3. Add the environment variables from `.env.example` in
   **Vercel → Project → Settings → Environment Variables**.
4. Set `NEXT_PUBLIC_SITE_URL` to your Vercel production URL and add
   `<prod-url>/auth/callback` to Supabase's redirect allow-list.
5. Deploy. Subsequent pushes to the default branch trigger production
   deployments; pull requests get preview deployments automatically.

---

## Obsidian export

Users can export their readiness data as an Obsidian-friendly Markdown vault:

- **Dashboard → “Export to Obsidian”** downloads `readiness-obsidian-vault.zip`
  — an index note (map-of-content) plus one note per assessment, cross-linked
  with `[[wikilinks]]`, each with YAML frontmatter, tags, callouts and a
  category table. Unzip it into any Obsidian vault.
- **Summary → “Export note”** downloads the current assessment as a single
  `.md` note.

Implemented server-side in `src/app/api/export/obsidian/route.ts` using a
dependency-free ZIP writer (`src/lib/zip.ts`) and the vault renderer
(`src/lib/obsidian/export.ts`). Exports are always scoped to the signed-in user.

## Extending the assessment

The questionnaire is defined once in `src/lib/assessment/questions.ts`. Add or
edit questions there — the UI, the Zod validation schema, and the scoring all
derive from that single source of truth automatically.

## Tech stack

- **Hosting:** Vercel
- **Source control / CI:** GitHub
- **Database & Auth:** Supabase (Postgres + RLS)
- **Framework:** Next.js App Router, React 19, TypeScript
- **Styling:** Tailwind CSS
- **Validation:** Zod
- **AI:** Anthropic Claude (with local fallback)
