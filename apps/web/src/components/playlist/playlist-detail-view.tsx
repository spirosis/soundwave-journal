"use client";

import { useState } from "react";
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import {
  getPlaylistTracks,
  removeTrackFromPlaylist,
  type Playlist,
} from "../../lib/api/playlists";

const TRACKS_PAGE_SIZE = 12;

function formatDuration(durationSec: number): string {
  const minutes = Math.floor(durationSec / 60);
  const seconds = durationSec % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

interface PlaylistDetailViewProps {
  playlist: Playlist | null;
  page: number;
  onPreviousPage: () => void;
  onNextPage: () => void;
  onTrackRemoved: (details: {
    playlistId: string;
    page: number;
    removedLastItemFromPage: boolean;
  }) => void;
}

export function PlaylistDetailView({
  playlist,
  page,
  onPreviousPage,
  onTrackRemoved,
  onNextPage,
}: PlaylistDetailViewProps) {
  const queryClient = useQueryClient();
  const [pendingRemovalIds, setPendingRemovalIds] = useState<Set<number>>(
    () => new Set()
  );
  const playlistTracksQuery = useQuery({
    queryKey: ["playlist-tracks", playlist?.id, page, TRACKS_PAGE_SIZE],
    queryFn: () => getPlaylistTracks(playlist!.id, page, TRACKS_PAGE_SIZE),
    enabled: Boolean(playlist?.id),
    placeholderData: keepPreviousData,
  });

  const trackItems = playlistTracksQuery.data?.items ?? [];
  const hasMoreTracks = playlistTracksQuery.data?.hasMore ?? false;

  const removeTrackMutation = useMutation({
    mutationFn: ({
      playlistId,
      deezerTrackId,
    }: {
      playlistId: string;
      deezerTrackId: number;
    }) => removeTrackFromPlaylist(playlistId, deezerTrackId),

    onMutate: ({ deezerTrackId }) => {
      setPendingRemovalIds((current) => {
        const next = new Set(current);
        next.add(deezerTrackId);
        return next;
      });
    },

    onSuccess: async (_data, variables) => {
      onTrackRemoved({
        playlistId: variables.playlistId,
        page,
        removedLastItemFromPage: trackItems.length === 1,
      });

      await queryClient.invalidateQueries({
        queryKey: ["playlist-tracks", variables.playlistId],
      });
    },

    onSettled: (_data, _error, variables) => {
      setPendingRemovalIds((current) => {
        const next = new Set(current);
        next.delete(variables.deezerTrackId);
        return next;
      });
    },
  });
  return (
    <section className="rounded-[28px] border border-stone-300 bg-white p-6 shadow-sm">
      {!playlist ? (
        <>
          <h3 className="text-2xl font-semibold tracking-tight text-stone-950">
            No playlist selected
          </h3>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-stone-600">
            Crea una playlist o selecciona una existente para ver sus tracks.
          </p>
        </>
      ) : (
        <>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-stone-500">
                Selected playlist
              </p>
              <h3 className="mt-2 text-2xl font-semibold tracking-tight text-stone-950">
                {playlist.name}
              </h3>
              <p className="mt-3 text-sm leading-7 text-stone-600">
                Aquí verás los tracks agregados. El siguiente paso será conectar
                “Add to playlist” desde Search.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onPreviousPage}
                disabled={page === 1 || playlistTracksQuery.isFetching}
                className="rounded-xl border border-stone-300 px-4 py-2 text-sm font-medium text-stone-900 transition hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Previous
              </button>

              <button
                type="button"
                onClick={onNextPage}
                disabled={!hasMoreTracks || playlistTracksQuery.isFetching}
                className="rounded-xl border border-stone-300 px-4 py-2 text-sm font-medium text-stone-900 transition hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Next
              </button>
            </div>
          </div>

          {removeTrackMutation.error ? (
            <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {removeTrackMutation.error.message}
            </div>
          ) : null}
          {playlistTracksQuery.isLoading ? (
            <p className="mt-6 text-sm text-stone-600">Loading tracks...</p>
          ) : playlistTracksQuery.error ? (
            <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {playlistTracksQuery.error.message}
            </div>
          ) : trackItems.length === 0 ? (
            <p className="mt-6 text-sm leading-7 text-stone-600">
              Esta playlist todavía no tiene tracks.
            </p>
          ) : (
            <div className="mt-6 space-y-4">
              {trackItems.map((track) => (
                <article
                  key={track.id}
                  className="rounded-2xl border border-stone-200 bg-stone-50 p-4"
                >
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <p className="text-base font-semibold text-stone-950">
                        {track.position}. {track.trackTitle}
                      </p>
                      <p className="mt-1 text-sm text-stone-700">
                        {track.artistName}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2 text-xs text-stone-600">
                        <span className="rounded-full bg-white px-3 py-1">
                          {formatDuration(track.durationSec)}
                        </span>
                        <span className="rounded-full bg-white px-3 py-1">
                          Track #{track.deezerTrackId}
                        </span>
                      </div>
                    </div>

                    <div className="flex w-full flex-col gap-2 md:w-64">
                      {track.previewUrl ? (
                        <audio
                          controls
                          preload="none"
                          src={track.previewUrl}
                          className="w-full"
                        />
                      ) : null}

                      <button
                        type="button"
                        onClick={() => {
                          removeTrackMutation.reset();
                          removeTrackMutation.mutate({
                            playlistId: playlist.id,
                            deezerTrackId: track.deezerTrackId,
                          });
                        }}
                        disabled={pendingRemovalIds.has(track.deezerTrackId)}
                        className="rounded-xl border border-red-200 px-3 py-2 text-sm font-medium text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {pendingRemovalIds.has(track.deezerTrackId)
                          ? "Removing..."
                          : "Remove track"}
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </>
      )}
    </section>
  );
}