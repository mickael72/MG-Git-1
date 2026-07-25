import Link from "next/link";
import { ArrowRight, BarChart3, ClipboardCheck, Sparkles } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getCurrentUser } from "@/lib/data/user";

const FEATURES = [
  {
    icon: ClipboardCheck,
    title: "Guided assessment",
    body: "A focused questionnaire across strategy, process, team and technology — takes about three minutes.",
  },
  {
    icon: Sparkles,
    title: "AI-generated summary",
    body: "Get an instant, personalised readiness summary with concrete next steps, powered by Claude.",
  },
  {
    icon: BarChart3,
    title: "Live dashboard",
    body: "Track your score, category breakdown and history in one clean dashboard.",
  },
];

export default async function LandingPage() {
  const user = await getCurrentUser();

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <span className="grid h-8 w-8 place-items-center rounded-md bg-primary text-primary-foreground">
              R
            </span>
            Readiness
          </Link>
          <nav className="flex items-center gap-3">
            {user ? (
              <Link href="/dashboard" className={buttonVariants()}>
                Go to dashboard
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-sm font-medium text-muted-foreground hover:text-foreground"
                >
                  Log in
                </Link>
                <Link href="/signup" className={buttonVariants()}>
                  Get started
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      <main className="flex-1">
        <section className="mx-auto max-w-6xl px-6 py-24 text-center">
          <div className="mx-auto max-w-3xl">
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-secondary px-3 py-1 text-xs font-medium text-muted-foreground">
              <Sparkles className="h-3.5 w-3.5" /> AI-powered readiness platform
            </span>
            <h1 className="mt-6 text-4xl font-bold tracking-tight sm:text-6xl">
              Understand your team&apos;s readiness in minutes
            </h1>
            <p className="mt-6 text-lg text-muted-foreground">
              Onboard, complete a short assessment, and receive an AI-generated
              summary with a personalised dashboard to track your progress over
              time.
            </p>
            <div className="mt-10 flex items-center justify-center gap-4">
              <Link
                href={user ? "/dashboard" : "/signup"}
                className={buttonVariants({ size: "lg" })}
              >
                {user ? "Open dashboard" : "Start free assessment"}
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/login"
                className={buttonVariants({ size: "lg", variant: "outline" })}
              >
                I already have an account
              </Link>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-6 pb-24">
          <div className="grid gap-6 md:grid-cols-3">
            {FEATURES.map((f) => (
              <Card key={f.title}>
                <CardContent className="pt-6">
                  <div className="mb-4 grid h-10 w-10 place-items-center rounded-md bg-primary/10 text-primary">
                    <f.icon className="h-5 w-5" />
                  </div>
                  <h3 className="mb-2 font-semibold">{f.title}</h3>
                  <p className="text-sm text-muted-foreground">{f.body}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-6 py-6 text-sm text-muted-foreground sm:flex-row">
          <p>© {new Date().getFullYear()} Readiness. Built with Next.js &amp; Supabase.</p>
          <p>Deployed on Vercel.</p>
        </div>
      </footer>
    </div>
  );
}
