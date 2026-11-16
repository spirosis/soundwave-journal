import type { Metadata } from "next";
import { MusicShell } from "../../../components/app/music-shell";
import { PageHeader } from "../../../components/app/page-header";
import { LibraryView } from "../../../components/library/library-view";
import { PlaylistsView } from "../../../components/playlist/playlists-view";

export const metadata: Metadata = { title: "Library" };

export default function LibraryPage() {
  return (
    <MusicShell active="library">
      <PageHeader
        eyebrow="Library"
        title="What stayed with you."
        lead="Favorites and playlists you've built. Every preview here counts toward your journal too."
      />
      <LibraryView />
      <PlaylistsView />
    </MusicShell>
  );
}
