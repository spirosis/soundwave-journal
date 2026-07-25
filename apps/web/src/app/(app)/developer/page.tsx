import { AppShell } from "../../../components/app/app-shell";

export default function DeveloperPage() {
  return (
    <AppShell
      title="Developer Mode"
      description="Placeholder inicial para diagnóstico técnico visible."
    >
      <div className="rounded-[28px] border border-stone-300 bg-white p-6 shadow-sm">
        <h3 className="text-2xl font-semibold tracking-tight text-stone-950">
          Developer Mode placeholder
        </h3>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-stone-600">
          Aquí conectarás más adelante `/api/rate-limit/status` y
          `/api/rate-limit/compare`.
        </p>
      </div>
    </AppShell>
  );
}