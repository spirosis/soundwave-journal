"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "../../lib/store/auth";
import { LogoMark } from "../app/logo-mark";
import styles from "./auth-shell.module.css";

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
      <main className={`${styles.root} aurora`}>
        <div className={styles.restoring} role="status">
          <LogoMark size="lg" />
          <p className={styles.restoringText}>Restoring your session...</p>
        </div>
      </main>
    );
  }

  if (status === "unauthenticated") {
    return null;
  }

  return <>{children}</>;
}
