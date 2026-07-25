"use client";

import { useAuthStore } from "../../lib/store/auth";
import { AppShell } from "../../components/app/app-shell";

export default function Home() {
  const user = useAuthStore((state) => state.user);
  const accessToken = useAuthStore((state) => state.accessToken);
  const status = useAuthStore((state) => state.status);

  return (
    <AppShell
      title="Home"
      description="Primer shell real de la app. Todavía conserva un bloque pequeño de diagnóstico mientras arrancamos Search, Discovery y el resto de áreas."
    >
      <div className="grid gap-6 xl:grid-cols-[1.3fr_0.7fr]">
        <section className="rounded-[28px] border border-stone-300 bg-white p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-stone-500">
            Welcome Back
          </p>
          <h3 className="mt-3 text-3xl font-semibold tracking-tight text-stone-950">
            {user?.displayName || user?.email || "Authenticated User"}
          </h3>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-stone-600">
            Ya tienes auth, bootstrap de sesión, logout y guard protegido.
            El siguiente paso natural es poblar este shell con Search y Discovery
            usando datos reales del backend.
          </p>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <article className="rounded-3xl bg-[#f6f2ea] p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                Next Feature
              </p>
              <p className="mt-3 text-lg font-semibold text-stone-900">
                Search
              </p>
              <p className="mt-2 text-sm leading-6 text-stone-600">
                Buscador real con Deezer proxy, preview y acciones rápidas.
              </p>
            </article>

            <article className="rounded-3xl bg-[#f6f2ea] p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                Then
              </p>
              <p className="mt-3 text-lg font-semibold text-stone-900">
                Discovery
              </p>
              <p className="mt-2 text-sm leading-6 text-stone-600">
                Explorar música y preparar la home como hub real.
              </p>
            </article>

            <article className="rounded-3xl bg-[#f6f2ea] p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                Later
              </p>
              <p className="mt-3 text-lg font-semibold text-stone-900">
                Developer Mode
              </p>
              <p className="mt-2 text-sm leading-6 text-stone-600">
                Conectar status y compare del rate limiting a una UI real.
              </p>
            </article>
          </div>
        </section>

        <aside className="space-y-6">
          <section className="rounded-[28px] border border-stone-300 bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-stone-950">
              Session Health
            </h3>
            <div className="mt-4 space-y-3 text-sm text-stone-700">
              <div className="flex items-center justify-between rounded-2xl bg-stone-100 px-4 py-3">
                <span>Status</span>
                <span className="font-medium">{status}</span>
              </div>
              <div className="flex items-center justify-between rounded-2xl bg-stone-100 px-4 py-3">
                <span>Access token</span>
                <span className="font-medium">
                  {accessToken ? "Present" : "Missing"}
                </span>
              </div>
              <div className="rounded-2xl bg-stone-100 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-stone-500">
                  User Email
                </p>
                <p className="mt-2 break-all font-medium text-stone-900">
                  {user?.email ?? "No user loaded"}
                </p>
              </div>
            </div>
          </section>

          <section className="rounded-[28px] border border-stone-300 bg-[#cfe7d8] p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-900/70">
              Current State
            </p>
            <h3 className="mt-3 text-xl font-semibold tracking-tight text-emerald-950">
              Frontend auth ya está operativo
            </h3>
            <p className="mt-3 text-sm leading-7 text-emerald-950/80">
              El shell ya corre sobre sesión protegida real. No hace falta seguir
              agregando infraestructura de auth antes de empezar Search.
            </p>
          </section>
        </aside>
      </div>
    </AppShell>
  );
}