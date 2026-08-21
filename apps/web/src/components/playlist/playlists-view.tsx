"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createPlaylist,
  getPlaylists,
} from "../../lib/api/playlists";
import { PlaylistDetailView } from "./playlist-detail-view";

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("es-GT", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

export function PlaylistsView() {
  const queryClient = useQueryClient();
  const [draftName, setDraftName] = useState("");
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(null);
  const [tracksPage, setTracksPage] = useState(1);

  const playlistsQuery = useQuery({
    queryKey: ["playlists"],
    queryFn: getPlaylists,
  });

  const selectedPlaylist = useMemo(() => {
    return (
      playlistsQuery.data?.find((playlist) => playlist.id === selectedPlaylistId) ??
      playlistsQuery.data?.[0] ??
      null
    );
  }, [playlistsQuery.data, selectedPlaylistId]);

  const createPlaylistMutation = useMutation({
    mutationFn: createPlaylist,
    onSuccess: (playlist) => {
      setDraftName("");
      setSelectedPlaylistId(playlist.id);
      setTracksPage(1);
      void queryClient.invalidateQueries({ queryKey: ["playlists"] });
    },
  });

  if (playlistsQuery.isLoading) {
    return (
      <section className="rounded-[28px] border border-stone-300 bg-white p-6 shadow-sm">
        <p className="text-sm text-stone-600">Loading playlists...</p>
      </section>
    );
  }

  if (playlistsQuery.error) {
    return (
      <section className="rounded-[28px] border border-red-200 bg-red-50 p-6 shadow-sm">
        <h3 className="text-xl font-semibold text-red-900">
          Could not load playlists
        </h3>
        <p className="mt-3 text-sm leading-7 text-red-700">
          {playlistsQuery.error.message}
        </p>
      </section>
    );
  }

  const playlists = playlistsQuery.data ?? [];

  return (
    <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
      <aside className="space-y-6">
        <section className="rounded-[28px] border border-stone-300 bg-white p-6 shadow-sm">
          <h3 className="text-xl font-semibold tracking-tight text-stone-950">
            Create playlist
          </h3>

          <form
            onSubmit={(event) => {
              event.preventDefault();
              const name = draftName.trim();

              if (!name) {
                return;
              }

              createPlaylistMutation.reset();
              createPlaylistMutation.mutate({ name });
            }}
            className="mt-4 space-y-4"
          >
            <input
              type="text"
              value={draftName}
              onChange={(event) => setDraftName(event.target.value)}
              placeholder="Late Night Discoveries"
              className="w-full rounded-2xl border border-stone-300 bg-stone-50 px-4 py-3 text-sm outline-none transition focus:border-stone-950 focus:bg-white"
            />

            {createPlaylistMutation.error ? (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {createPlaylistMutation.error.message}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={!draftName.trim() || createPlaylistMutation.isPending}
              className="rounded-2xl bg-stone-950 px-4 py-3 text-sm font-medium text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {createPlaylistMutation.isPending ? "Creating..." : "Create playlist"}
            </button>
          </form>
        </section>

        <section className="rounded-[28px] border border-stone-300 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold tracking-tight text-stone-950">
              Your playlists
            </h3>
            <span className="rounded-full bg-stone-100 px-3 py-1 text-xs text-stone-600">
              {playlists.length}
            </span>
          </div>

          {playlists.length === 0 ? (
            <p className="mt-4 text-sm leading-7 text-stone-600">
              Todavía no has creado playlists.
            </p>
          ) : (
            <div className="mt-4 space-y-3">
              {playlists.map((playlist) => {
                const isSelected = selectedPlaylist?.id === playlist.id;

                return (
                  <button
                    key={playlist.id}
                    type="button"
                    onClick={() => {
                      setSelectedPlaylistId(playlist.id);
                      setTracksPage(1);
                    }}
                    className={`w-full rounded-2xl border px-4 py-4 text-left transition ${isSelected
                        ? "border-stone-900 bg-stone-950 text-white"
                        : "border-stone-300 bg-stone-50 text-stone-900 hover:bg-white"
                      }`}
                  >
                    <p className="text-sm font-semibold">{playlist.name}</p>
                    <p
                      className={`mt-2 text-xs ${isSelected ? "text-stone-300" : "text-stone-500"
                        }`}
                    >
                      Created {formatDate(playlist.createdAt)}
                    </p>
                  </button>
                );
              })}
            </div>
          )}
        </section>
      </aside>

      <PlaylistDetailView
        playlist={selectedPlaylist}
        page={tracksPage}
        onPreviousPage={() =>
          setTracksPage((current) => Math.max(current - 1, 1))
        }
        onNextPage={() => setTracksPage((current) => current + 1)}
        onTrackRemoved={({
          playlistId,
          page,
          removedLastItemFromPage,
        }) => {
          const isCurrentPlaylist = selectedPlaylist?.id === playlistId;
          const isCurrentPage = tracksPage === page;

          if (
            isCurrentPlaylist &&
            isCurrentPage &&
            removedLastItemFromPage &&
            page > 1
          ) {
            setTracksPage(page - 1);
          }
        }}
      />
    </div>
  );
}