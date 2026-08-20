import { MusicShell } from "../../../components/app/music-shell";
import { SearchView } from "../../../components/search/search-view";

export default function SearchPage() {
  return (
    <MusicShell active="search">
      <SearchView />
    </MusicShell>
  );
}
