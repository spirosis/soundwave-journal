"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { searchTracks } from "../../lib/api/search";
import { addFavorite, getFavorites } from "../../lib/api/favorites";

function formatDuration(durationSec: number): string {
  const minutes = Math.floor(durationSec / 60);
  const seconds = durationSec % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

export function SearchView() {
  const queryClient = useQueryClient();
  const [draftQuery, setDraftQuery] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState("");
  const [pendingFavoriteId, setPendingFavoriteId] = useState<number | null>(null);
  const [justFavoritedIds, setJustFavoritedIds] = useState<Set<number>>(new Set());

  const searchQuery = useQuery({
    queryKey: ["search", submittedQuery],
    queryFn: () => searchTracks(submittedQuery),
    enabled: submittedQuery.trim().length > 0,
  });

  const favoritesQuery = useQuery({
    queryKey: ["favorites", 1, 100],
    queryFn: () => getFavorites(1, 100),
  });

  const favoriteMutation = useMutation({
    mutationFn: async (deezerTrackId: number) => {
      setPendingFavoriteId(deezerTrackId);
      return addFavorite(deezerTrackId);
    },
    onSuccess: (favorite) => {
      setJustFavoritedIds((current) => {
        const next = new Set(current);
        next.add(favorite.deezerTrackId);
        return next;
      });

      void queryClient.invalidateQueries({ queryKey: ["favorites"] });
    },
    onSettled: () => {
      setPendingFavoriteId(null);
    },
  });

  const tracks = searchQuery.data?.data ?? [];
  const total = searchQuery.data?.total ?? 0;

  const favoritedIds = useMemo(() => {
    const ids = new Set<number>();

    for (const favorite of favoritesQuery.data?.items ?? []) {
      ids.add(favorite.deezerTrackId);
    }

    for (const id of justFavoritedIds) {
      ids.add(id);
    }

    return ids;
  }, [favoritesQuery.data?.items, justFavoritedIds]);

  

  return (
    <div className="space-y-6">
      <section className="rounded-[28px] border border-stone-300 bg-white p-6 shadow-sm">
        <form
          onSubmit={(event) => {
            event.preventDefault();
            setSubmittedQuery(draftQuery.trim());
          }}
          className="flex flex-col gap-4 lg:flex-row"
        >
          <div className="flex-1">
            <label
              htmlFor="search-query"
              className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-stone-500"
            >
              Search tracks
            </label>
            <input
              id="search-query"
              type="text"
              value={draftQuery}
              onChange={(event) => setDraftQuery(event.target.value)}
              placeholder="Busca por track, artista o álbum"
              className="w-full rounded-2xl border border-stone-300 bg-stone-50 px-4 py-3 text-sm outline-none transition focus:border-stone-950 focus:bg-white"
            />
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              disabled={!draftQuery.trim() || searchQuery.isFetching}
              className="rounded-2xl bg-stone-950 px-5 py-3 text-sm font-medium text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {searchQuery.isFetching ? "Searching..." : "Search"}
            </button>
          </div>
        </form>

        <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-stone-600">
          <span className="rounded-full bg-stone-100 px-3 py-1">
            Query: {submittedQuery || "none"}
          </span>
          <span className="rounded-full bg-stone-100 px-3 py-1">
            Total: {submittedQuery ? total : 0}
          </span>
        </div>

        {searchQuery.error ? (
          <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {searchQuery.error.message}
          </div>
        ) : null}
      </section>

        {favoriteMutation.error ? (
          <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {favoriteMutation.error.message}
          </div>
        ) : null}

      {!submittedQuery ? (
        <section className="rounded-[28px] border border-stone-300 bg-white p-6 shadow-sm">
          <h3 className="text-2xl font-semibold tracking-tight text-stone-950">
            Start with a real query
          </h3>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-stone-600">
            Esta vista ya está conectada al backend real. Envía una búsqueda y
            deberías ver resultados normalizados desde el proxy de Deezer.
          </p>
        </section>
      ) : null}

      {submittedQuery && searchQuery.isLoading ? (
        <section className="rounded-[28px] border border-stone-300 bg-white p-6 shadow-sm">
          <p className="text-sm text-stone-600">Loading results...</p>
        </section>
      ) : null}

      {submittedQuery && !searchQuery.isLoading && !searchQuery.error && tracks.length === 0 ? (
        <section className="rounded-[28px] border border-stone-300 bg-white p-6 shadow-sm">
          <h3 className="text-xl font-semibold text-stone-950">No results</h3>
          <p className="mt-3 text-sm leading-7 text-stone-600">
            La búsqueda no devolvió tracks. Prueba otra combinación de artista,
            track o álbum.
          </p>
        </section>
      ) : null}

      {tracks.length > 0 ? (
        <section className="space-y-4">
          {tracks.map((track) => (
            <article
              key={track.id}
              className="grid gap-4 rounded-[28px] border border-stone-300 bg-white p-5 shadow-sm md:grid-cols-[96px_1fr_auto]"
            >
              <div className="overflow-hidden rounded-2xl bg-stone-200">
                {track.coverUrl ? (
                  <Image
                    src={track.coverUrl}
                    alt={`${track.title} cover`}
                    width={96}
                    height={96}
                    className="h-24 w-24 object-cover"
                    unoptimized
                  />
                ) : (
                  <div className="flex h-24 w-24 items-center justify-center text-xs font-medium text-stone-500">
                    No cover
                  </div>
                )}
              </div>

              <div className="min-w-0">
                <p className="text-lg font-semibold tracking-tight text-stone-950">
                  {track.title}
                </p>
                <p className="mt-1 text-sm text-stone-700">{track.artistName}</p>
                <p className="mt-1 text-sm text-stone-500">{track.albumTitle}</p>

                <div className="mt-4 flex flex-wrap gap-2 text-xs text-stone-600">
                  <span className="rounded-full bg-stone-100 px-3 py-1">
                    {formatDuration(track.durationSec)}
                  </span>
                  <span className="rounded-full bg-stone-100 px-3 py-1">
                    Track #{track.id}
                  </span>
                  <span className="rounded-full bg-stone-100 px-3 py-1">
                    {track.previewUrl ? "Preview available" : "No preview"}
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-2 md:items-end">
                {track.previewUrl ? (
                  <audio
                    controls
                    preload="none"
                    src={track.previewUrl}
                    className="w-full md:w-64"
                  />
                ) : null}

                                <button
                  type="button"
                  onClick={() => favoriteMutation.mutate(track.id)}
                  disabled={
                    favoritedIds.has(track.id) || pendingFavoriteId === track.id
                  }
                  className="rounded-xl border border-stone-300 px-4 py-2 text-sm font-medium text-stone-900 transition hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {favoritedIds.has(track.id)
                    ? "Favorited"
                    : pendingFavoriteId === track.id
                      ? "Saving..."
                      : "Favorite"}
                </button>

                {track.deezerUrl ? (
                  <a
                    href={track.deezerUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-xl border border-stone-300 px-4 py-2 text-sm font-medium text-stone-900 transition hover:bg-stone-100"
                  >
                    Open in Deezer
                  </a>
                ) : null}
              </div>
            </article>
          ))}
        </section>
      ) : null}
    </div>
  );
}