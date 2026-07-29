import { AppShell } from "../../../components/app/app-shell";
import { LibraryView } from "../../../components/library/library-view";
import { PlaylistsView } from "../../../components/playlist/playlists-view";

export default function LibraryPage() {
  return (
    <AppShell
      title="Library"
      description="Favoritos y playlists reales cargados desde el backend. Esta vista ya conecta los dos frentes principales de la biblioteca."
    >
      <div className="space-y-10">
        <LibraryView />
        <PlaylistsView />
      </div>
    </AppShell>
  );
}