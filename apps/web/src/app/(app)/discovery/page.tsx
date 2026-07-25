import { AppShell } from "../../../components/app/app-shell";

export default function DiscoveryPage() {
  return (
    <AppShell
      title="Discovery"
      description="Placeholder inicial para la sección de descubrimiento."
    >
      <div className="rounded-[28px] border border-stone-300 bg-white p-6 shadow-sm">
        <h3 className="text-2xl font-semibold tracking-tight text-stone-950">
          Discovery placeholder
        </h3>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-stone-600">
          Esta sección crecerá después de Search y servirá como base para la
          home orientada a discovery.
        </p>
      </div>
    </AppShell>
  );
}