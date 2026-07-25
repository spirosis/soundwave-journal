"use client";

import Link from "next/link";
import { useMutation } from "@tanstack/react-query";
import { logout } from "../../lib/api/auth";
import { useAuthStore } from "../../lib/store/auth";

interface AppShellProps {
  title: string;
  description: string;
  children: React.ReactNode;
}

const navItems = [
  { href: "/", label: "Home" },
  { href: "/search", label: "Search" },
  { href: "/discovery", label: "Discovery" },
  { href: "/library", label: "Library" },
  { href: "/journal", label: "Journal" },
  { href: "/developer", label: "Developer Mode" },
];

export function AppShell({ title, description, children }: AppShellProps) {
  const user = useAuthStore((state) => state.user);
  const clear = useAuthStore((state) => state.clear);

  const logoutMutation = useMutation({
    mutationFn: logout,
    onSuccess: () => {
      clear();
    },
    onError: () => {
      clear();
    },
  });

  return (
    <div className="min-h-screen bg-[#f5f1e8] text-stone-900">
      <div className="mx-auto grid min-h-screen max-w-7xl grid-cols-1 lg:grid-cols-[260px_1fr]">
        <aside className="border-b border-stone-300 bg-[#1f3a2e] px-6 py-8 text-stone-100 lg:border-b-0 lg:border-r">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-200/80">
              SoundWave Journal
            </p>
            <h1 className="text-2xl font-semibold tracking-tight">
              Listening App Shell
            </h1>
            <p className="text-sm leading-6 text-stone-300">
              Base protegida para discovery, library, journal y developer mode.
            </p>
          </div>

          <nav className="mt-10 flex flex-col gap-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-2xl px-4 py-3 text-sm font-medium text-stone-100 transition hover:bg-white/10"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>

        <div className="flex min-h-screen flex-col">
          <header className="border-b border-stone-300 bg-[#efe7d6] px-6 py-5">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-stone-500">
                  Protected Area
                </p>
                <h2 className="text-3xl font-semibold tracking-tight">{title}</h2>
                <p className="max-w-2xl text-sm leading-6 text-stone-600">
                  {description}
                </p>
              </div>

              <div className="flex flex-col items-start gap-3 rounded-2xl border border-stone-300 bg-white px-4 py-3 shadow-sm">
                <div>
                  <p className="text-xs font-medium uppercase tracking-[0.18em] text-stone-500">
                    Signed in as
                  </p>
                  <p className="mt-1 text-sm font-medium text-stone-900">
                    {user?.email ?? "Unknown user"}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => logoutMutation.mutate()}
                  disabled={logoutMutation.isPending}
                  className="rounded-xl bg-stone-950 px-4 py-2 text-sm font-medium text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {logoutMutation.isPending ? "Closing session..." : "Logout"}
                </button>
              </div>
            </div>
          </header>

          <main className="flex-1 px-6 py-8">{children}</main>
        </div>
      </div>
    </div>
  );
}