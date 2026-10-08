import { MusicShell } from "../../../components/app/music-shell";
import { SearchView } from "../../../components/search/search-view";

interface SearchPageProps {
  searchParams: Promise<{
    q?: string;
    source?: string;
  }>;
}

export default async function SearchPage({
  searchParams,
}: SearchPageProps) {
  const params = await searchParams;

  const initialQuery =
    typeof params.q === "string" ? params.q.trim() : "";

  const initialSource =
    params.source === "recommendation" ? "recommendation" : "search";

  return (
    <MusicShell active="search">
      <SearchView
        key={`${initialSource}:${initialQuery}`}
        initialQuery={initialQuery}
        initialSource={initialSource}
      />
    </MusicShell>
  );
}
