"use client";

import { useState } from "react";
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { ArrowDown, ArrowUp, Pencil, Trash2, X } from "lucide-react";
import {
  deletePlaylist,
  getPlaylistTracks,
  moveTrackInPlaylist,
  removeTrackFromPlaylist,
  renamePlaylist,
  type MoveDirection,
  type Playlist,
} from "../../lib/api/playlists";
import { formatDuration } from "../../lib/format";
import { PreviewCover } from "../player/preview-cover";
import styles from "./playlists.module.css";

const TRACKS_PAGE_SIZE = 12;

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
  onPlaylistDeleted: (playlistId: string) => void;
}

export function PlaylistDetailView({
  playlist,
  page,
  onPreviousPage,
  onTrackRemoved,
  onNextPage,
  onPlaylistDeleted,
}: PlaylistDetailViewProps) {
  const queryClient = useQueryClient();
  const [pendingRemovalIds, setPendingRemovalIds] = useState<Set<number>>(
    () => new Set()
  );
  const [pendingMoveIds, setPendingMoveIds] = useState<Set<number>>(
    () => new Set()
  );

  const [isRenaming, setIsRenaming] = useState(false);
  const [renameDraft, setRenameDraft] = useState("");
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  const renamePlaylistMutation = useMutation({
    mutationFn: ({ playlistId, name }: { playlistId: string; name: string }) =>
      renamePlaylist(playlistId, name),
    onSuccess: async () => {
      setIsRenaming(false);
      await queryClient.invalidateQueries({ queryKey: ["playlists"] });
    },
  });

  const deletePlaylistMutation = useMutation({
    mutationFn: (playlistId: string) => deletePlaylist(playlistId),
    onSuccess: async (_data, playlistId) => {
      setIsConfirmingDelete(false);
      onPlaylistDeleted(playlistId);
      await queryClient.invalidateQueries({ queryKey: ["playlists"] });
    },
  });

  const playlistTracksQuery = useQuery({
    queryKey: ["playlist-tracks", playlist?.id, page, TRACKS_PAGE_SIZE],
    queryFn: () => getPlaylistTracks(playlist!.id, page, TRACKS_PAGE_SIZE),
    enabled: Boolean(playlist?.id),
    placeholderData: keepPreviousData,
  });

  const trackItems = playlistTracksQuery.data?.items ?? [];
  const hasMoreTracks = playlistTracksQuery.data?.hasMore ?? false;
  const totalTracks = playlistTracksQuery.data?.total ?? 0;

  const removeTrackMutation = useMutation({
    mutationFn: ({
      playlistId,
      deezerTrackId,
    }: {
      playlistId: string;
      deezerTrackId: number;
    }) => removeTrackFromPlaylist(playlistId, deezerTrackId),
    onMutate: ({ deezerTrackId }) => {
      setPendingRemovalIds((current) => new Set(current).add(deezerTrackId));
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

  const moveTrackMutation = useMutation({
    mutationFn: ({
      playlistId,
      deezerTrackId,
      direction,
    }: {
      playlistId: string;
      deezerTrackId: number;
      direction: MoveDirection;
    }) => moveTrackInPlaylist(playlistId, deezerTrackId, direction),
    onMutate: ({ deezerTrackId }) => {
      setPendingMoveIds((current) => new Set(current).add(deezerTrackId));
    },
    onSuccess: async (_data, variables) => {
      await queryClient.invalidateQueries({
        queryKey: ["playlist-tracks", variables.playlistId],
      });
    },
    onSettled: (_data, _error, variables) => {
      setPendingMoveIds((current) => {
        const next = new Set(current);
        next.delete(variables.deezerTrackId);
        return next;
      });
    },
  });

  if (!playlist) {
    return (
      <div className={`${styles.detail} ${styles.detailEmpty}`}>
        <h3 className={styles.detailTitle}>No playlist selected</h3>
        <p className={styles.muted}>
          Create a playlist or pick one from the list to see its tracks.
        </p>
      </div>
    );
  }

  return (
    <div className={styles.detail}>
      <header className={styles.detailHeader}>
        <div className={styles.detailHeading}>
          <p className={styles.eyebrow}>Selected playlist</p>

          {isRenaming ? (
            <form
              onSubmit={(event) => {
                event.preventDefault();
                const name = renameDraft.trim();

                if (!name || name === playlist.name) {
                  setIsRenaming(false);
                  return;
                }

                renamePlaylistMutation.mutate({ playlistId: playlist.id, name });
              }}
              className={styles.renameForm}
            >
              <label htmlFor="playlist-rename" className="sr-only">
                Rename playlist
              </label>
              <input
                id="playlist-rename"
                type="text"
                value={renameDraft}
                onChange={(event) => setRenameDraft(event.target.value)}
                autoFocus
                className={`${styles.input} ${styles.renameInput}`}
              />
              <button
                type="submit"
                disabled={!renameDraft.trim() || renamePlaylistMutation.isPending}
                className={styles.primaryButton}
              >
                {renamePlaylistMutation.isPending ? "Saving..." : "Save"}
              </button>
              <button
                type="button"
                onClick={() => setIsRenaming(false)}
                className={styles.ghostButton}
              >
                Cancel
              </button>
            </form>
          ) : (
            <div className={styles.titleRow}>
              <h3 className={styles.detailTitle}>{playlist.name}</h3>

              <button
                type="button"
                aria-label={`Rename playlist ${playlist.name}`}
                onClick={() => {
                  setRenameDraft(playlist.name);
                  setIsRenaming(true);
                }}
                className={styles.iconButton}
                title="Rename"
              >
                <Pencil size={15} />
              </button>

              {isConfirmingDelete ? (
                <span className={styles.confirmGroup}>
                  <button
                    type="button"
                    aria-label={`Confirm delete playlist ${playlist.name}`}
                    onClick={() => deletePlaylistMutation.mutate(playlist.id)}
                    disabled={deletePlaylistMutation.isPending}
                    className={styles.dangerButton}
                  >
                    {deletePlaylistMutation.isPending ? "Deleting..." : "Confirm delete"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsConfirmingDelete(false)}
                    className={styles.ghostButton}
                  >
                    Cancel
                  </button>
                </span>
              ) : (
                <button
                  type="button"
                  aria-label={`Delete playlist ${playlist.name}`}
                  onClick={() => setIsConfirmingDelete(true)}
                  className={`${styles.iconButton} ${styles.iconButtonDanger}`}
                  title="Delete playlist"
                >
                  <Trash2 size={15} />
                </button>
              )}
            </div>
          )}

          {renamePlaylistMutation.error ? (
            <p className={styles.inlineError}>{renamePlaylistMutation.error.message}</p>
          ) : null}
          {deletePlaylistMutation.error ? (
            <p className={styles.inlineError}>{deletePlaylistMutation.error.message}</p>
          ) : null}

          <p className={styles.muted}>
            {playlistTracksQuery.data
              ? `${totalTracks} ${totalTracks === 1 ? "track" : "tracks"} · add more from Search`
              : "Loading tracks..."}
          </p>
        </div>

        {totalTracks > TRACKS_PAGE_SIZE ? (
          <div className={styles.pagination}>
            <span className={styles.pageLabel}>Page {page}</span>
            <button
              type="button"
              aria-label="Previous page of tracks"
              onClick={onPreviousPage}
              disabled={page === 1 || playlistTracksQuery.isFetching}
              className={styles.pageButton}
            >
              Previous
            </button>
            <button
              type="button"
              aria-label="Next page of tracks"
              onClick={onNextPage}
              disabled={!hasMoreTracks || playlistTracksQuery.isFetching}
              className={styles.pageButton}
            >
              Next
            </button>
          </div>
        ) : null}
      </header>

      {removeTrackMutation.error ? (
        <div className={styles.errorBanner} role="alert">
          {removeTrackMutation.error.message}
        </div>
      ) : null}
      {moveTrackMutation.error ? (
        <div className={styles.errorBanner} role="alert">
          {moveTrackMutation.error.message}
        </div>
      ) : null}

      {playlistTracksQuery.isLoading ? null : playlistTracksQuery.error ? (
        <div className={styles.errorBanner} role="alert">
          {playlistTracksQuery.error.message}
        </div>
      ) : trackItems.length === 0 ? (
        <div className={styles.emptyTracks}>
          <p>This playlist has no tracks yet.</p>
          <p className={styles.muted}>
            Open any result in Search and use &ldquo;Add to playlist&rdquo;.
          </p>
        </div>
      ) : (
        <ol className={styles.trackList}>
          {trackItems.map((track) => {
            const isMovePending =
              pendingMoveIds.has(track.deezerTrackId) || moveTrackMutation.isPending;

            return (
              <li key={track.id} className={styles.trackRow}>
                <PreviewCover
                  track={{
                    id: track.deezerTrackId,
                    title: track.trackTitle,
                    artistName: track.artistName,
                    coverUrl: track.albumCoverUrl,
                    previewUrl: track.previewUrl,
                  }}
                  source="playlist"
                  size={52}
                />

                <div className={styles.trackInfo}>
                  <p className={styles.trackTitle}>
                    {track.position}. {track.trackTitle}
                  </p>
                  <p className={styles.trackArtist}>{track.artistName}</p>
                </div>

                <span className={styles.trackDuration}>
                  {formatDuration(track.durationSec)}
                </span>

                <div className={styles.trackActions}>
                  <button
                    type="button"
                    aria-label={`Move ${track.trackTitle} up`}
                    title="Move up"
                    onClick={() => {
                      moveTrackMutation.reset();
                      moveTrackMutation.mutate({
                        playlistId: playlist.id,
                        deezerTrackId: track.deezerTrackId,
                        direction: "up",
                      });
                    }}
                    disabled={track.position === 1 || isMovePending}
                    className={styles.iconButton}
                  >
                    <ArrowUp size={15} />
                  </button>

                  <button
                    type="button"
                    aria-label={`Move ${track.trackTitle} down`}
                    title="Move down"
                    onClick={() => {
                      moveTrackMutation.reset();
                      moveTrackMutation.mutate({
                        playlistId: playlist.id,
                        deezerTrackId: track.deezerTrackId,
                        direction: "down",
                      });
                    }}
                    disabled={track.position === totalTracks || isMovePending}
                    className={styles.iconButton}
                  >
                    <ArrowDown size={15} />
                  </button>

                  <button
                    type="button"
                    aria-label="Remove track"
                    title="Remove track"
                    onClick={() => {
                      removeTrackMutation.reset();
                      removeTrackMutation.mutate({
                        playlistId: playlist.id,
                        deezerTrackId: track.deezerTrackId,
                      });
                    }}
                    disabled={pendingRemovalIds.has(track.deezerTrackId)}
                    className={`${styles.iconButton} ${styles.iconButtonDanger}`}
                  >
                    <X size={15} />
                  </button>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
