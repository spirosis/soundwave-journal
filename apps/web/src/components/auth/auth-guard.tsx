"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "../../lib/store/auth";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const status = useAuthStore((state) => state.status);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    }
  }, [pathname, router, status]);

  if (status === "loading") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-stone-100 px-6 text-stone-900">
        <div className="rounded-3xl border border-stone-200 bg-white px-6 py-5 shadow-sm">
          <p className="text-sm font-medium uppercase tracking-[0.24em] text-stone-500">
            SoundWave Journal
          </p>
          <p className="mt-3 text-base text-stone-700">
            Verificando sesión...
          </p>
        </div>
      </main>
    );
  }

  if (status === "unauthenticated") {
    return null;
  }

  return <>{children}</>;
}