"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, ClipboardList, Sparkles, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { logout } from "@/app/(auth)/actions";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/assessment", label: "Assessment", icon: ClipboardList },
  { href: "/summary", label: "AI Summary", icon: Sparkles },
];

export function AppNav({ email }: { email: string | null }) {
  const pathname = usePathname();

  return (
    <aside className="flex w-full flex-col border-b border-border bg-card md:h-screen md:w-64 md:border-b-0 md:border-r">
      <div className="flex items-center gap-2 px-6 py-5 font-semibold">
        <span className="grid h-8 w-8 place-items-center rounded-md bg-primary text-primary-foreground">
          R
        </span>
        Readiness
      </div>

      <nav className="flex gap-1 px-3 md:flex-1 md:flex-col">
        {NAV.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground",
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="hidden border-t border-border p-3 md:block">
        {email && (
          <p className="truncate px-3 pb-2 text-xs text-muted-foreground">
            {email}
          </p>
        )}
        <form action={logout}>
          <button
            type="submit"
            className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <LogOut className="h-4 w-4" />
            Log out
          </button>
        </form>
      </div>
    </aside>
  );
}
