"use client";

import Image from "next/image";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getFavorites, removeFavorite } from "../../lib/api/favorites";

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("es-GT", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

export function LibraryView() {
  const queryClient = useQueryClient();

  const favoritesQuery = useQuery({
    queryKey: ["favorites", 1, 20],
    queryFn: () => getFavorites(1, 20),
  });

  const removeMutation = useMutation({
    mutationFn: (deezerTrackId: number) => removeFavorite(deezerTrackId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["favorites"] });
    },
  });

  const favorites = favoritesQuery.data?.items ?? [];

  if (favoritesQuery.isLoading) {
    return (
      <section className="rounded-[28px] border border-stone-300 bg-white p-6 shadow-sm">
        <p className="text-sm text-stone-600">Loading favorites...</p>
      </section>
    );
  }

  if (favoritesQuery.error) {
    return (
      <section className="rounded-[28px] border border-red-200 bg-red-50 p-6 shadow-sm">
        <h3 className="text-xl font-semibold text-red-900">
          Could not load favorites
        </h3>
        <p className="mt-3 text-sm leading-7 text-red-700">
          {favoritesQuery.error.message}
        </p>
      </section>
    );
  }

  if (favorites.length === 0) {
    return (
      <section className="rounded-[28px] border border-stone-300 bg-white p-6 shadow-sm">
        <h3 className="text-2xl font-semibold tracking-tight text-stone-950">
          No favorites yet
        </h3>
        <p className="mt-4 max-w-2xl text-sm leading-7 text-stone-600">
          Guarda tracks desde Search y aparecerán aquí. Esta vista ya consume
          `GET /api/favorites` real.
        </p>
      </section>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-[28px] border border-stone-300 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center gap-3 text-sm text-stone-600">
          <span className="rounded-full bg-stone-100 px-3 py-1">
            Total loaded: {favorites.length}
          </span>
          <span className="rounded-full bg-stone-100 px-3 py-1">
            Page: {favoritesQuery.data?.page ?? 1}
          </span>
          <span className="rounded-full bg-stone-100 px-3 py-1">
            Has more: {favoritesQuery.data?.hasMore ? "Yes" : "No"}
          </span>
        </div>
      </section>

      <section className="space-y-4">
        {favorites.map((favorite) => (
          <article
            key={favorite.id}
            className="grid gap-4 rounded-[28px] border border-stone-300 bg-white p-5 shadow-sm md:grid-cols-[96px_1fr_auto]"
          >
            <div className="overflow-hidden rounded-2xl bg-stone-200">
              {favorite.albumCoverUrl ? (
                <Image
                  src={favorite.albumCoverUrl}
                  alt={`${favorite.trackTitle} cover`}
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
                {favorite.trackTitle}
              </p>
              <p className="mt-1 text-sm text-stone-700">
                {favorite.artistName}
              </p>
              <div className="mt-4 flex flex-wrap gap-2 text-xs text-stone-600">
                <span className="rounded-full bg-stone-100 px-3 py-1">
                  Genre: {favorite.genre}
                </span>
                <span className="rounded-full bg-stone-100 px-3 py-1">
                  Added: {formatDate(favorite.createdAt)}
                </span>
                <span className="rounded-full bg-stone-100 px-3 py-1">
                  Track #{favorite.deezerTrackId}
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-2 md:items-end">
              {favorite.previewUrl ? (
                <audio
                  controls
                  preload="none"
                  src={favorite.previewUrl}
                  className="w-full md:w-64"
                />
              ) : null}

              <button
                type="button"
                onClick={() => removeMutation.mutate(favorite.deezerTrackId)}
                disabled={removeMutation.isPending}
                className="rounded-xl border border-stone-300 px-4 py-2 text-sm font-medium text-stone-900 transition hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {removeMutation.isPending ? "Removing..." : "Remove favorite"}
              </button>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}