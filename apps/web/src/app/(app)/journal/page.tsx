import { AppShell } from "../../../components/app/app-shell";

export default function LibraryPage() {
  return (
    <AppShell
      title="Library"
      description="Placeholder inicial para favoritos y playlists."
    >
      <div className="rounded-[28px] border border-stone-300 bg-white p-6 shadow-sm">
        <h3 className="text-2xl font-semibold tracking-tight text-stone-950">
          Library placeholder
        </h3>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-stone-600">
          Aquí vivirán favoritos, playlists y sus acciones asociadas.
        </p>
      </div>
    </AppShell>
  );
}