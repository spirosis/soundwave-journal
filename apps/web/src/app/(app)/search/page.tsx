import { AppShell } from "../../../components/app/app-shell";
import { SearchView } from "../../../components/search/search-view";

export default function SearchPage() {
  return (
    <AppShell
      title="Search"
      description="Búsqueda real contra el backend proxy de Deezer. Esta pantalla ya valida resultados, errores y previews desde la UI protegida."
    >
      <SearchView />
    </AppShell>
  );
}