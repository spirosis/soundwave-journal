import { MusicShell } from "../../../components/app/music-shell";
import { LibraryView } from "../../../components/library/library-view";
import { PlaylistsView } from "../../../components/playlist/playlists-view";

export default function LibraryPage() {
  return (
    <MusicShell active="library">
      <div className="space-y-10">
        <LibraryView />
        <PlaylistsView />
      </div>
    </MusicShell>
  );
}
