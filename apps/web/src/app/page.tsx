"use client";

import { useAuthStore } from "../lib/store/auth";

export default function Home() {
  const user = useAuthStore((state) => state.user);
  const accessToken = useAuthStore((state) => state.accessToken);
  const status = useAuthStore((state) => state.status);

  return (
    <main className="min-h-screen bg-stone-100 px-6 py-10 text-stone-900">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-8">
        <header className="space-y-3">
          <p className="text-sm font-medium uppercase tracking-[0.24em] text-stone-500">
            SoundWave Journal
          </p>
          <h1 className="text-4xl font-semibold tracking-tight">
            Auth Bootstrap Diagnostic
          </h1>
          <p className="max-w-2xl text-base leading-7 text-stone-600">
            Esta vista temporal confirma si el frontend puede hidratar sesión
            desde la cookie httpOnly usando <code>/auth/refresh</code> y luego
            cargar el perfil con <code>/auth/me</code>.
          </p>
        </header>

        <section className="grid gap-6 md:grid-cols-3">
          <article className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-stone-500">Status</p>
            <p className="mt-3 text-2xl font-semibold">{status}</p>
          </article>

          <article className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-stone-500">Access Token</p>
            <p className="mt-3 text-sm leading-6 text-stone-700">
              {accessToken ? "Present in memory" : "Missing"}
            </p>
          </article>

          <article className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-stone-500">User</p>
            <p className="mt-3 text-sm leading-6 text-stone-700">
              {user ? user.email : "No authenticated user loaded"}
            </p>
          </article>
        </section>

        <section className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold">Session Snapshot</h2>
          <pre className="mt-4 overflow-x-auto rounded-2xl bg-stone-950 p-4 text-sm leading-6 text-stone-100">
            {JSON.stringify(
              {
                status,
                accessTokenPresent: Boolean(accessToken),
                user,
              },
              null,
              2
            )}
          </pre>
        </section>

        <section className="rounded-3xl border border-amber-200 bg-amber-50 p-6 text-amber-950">
          <h2 className="text-lg font-semibold">Qué deberías observar</h2>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-6">
            <li>Si no hay cookie válida, el status termina en unauthenticated.</li>
            <li>Si hay cookie válida, el status termina en authenticated.</li>
            <li>Con sesión activa, accessToken debe aparecer como presente en memoria.</li>
            <li>Con sesión activa, user debe venir de /auth/me.</li>
          </ul>
        </section>
      </div>
    </main>
  );
}