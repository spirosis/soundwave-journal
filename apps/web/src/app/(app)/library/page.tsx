import { AppShell } from "../../../components/app/app-shell";
import { LibraryView } from "../../../components/library/library-view";

export default function LibraryPage() {
  return (
    <AppShell
      title="Library"
      description="Favoritos reales cargados desde el backend. Esta vista cierra el ciclo iniciado desde Search."
    >
      <LibraryView />
    </AppShell>
  );
}