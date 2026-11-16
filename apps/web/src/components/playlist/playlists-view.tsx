"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { createPlaylist, getPlaylists } from "../../lib/api/playlists";
import { formatDate } from "../../lib/format";
import { PlaylistDetailView } from "./playlist-detail-view";
import styles from "./playlists.module.css";

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

  const playlists = playlistsQuery.data ?? [];

  return (
    <section className={styles.section} aria-labelledby="playlists-heading">
      <h2 id="playlists-heading" className={styles.heading}>
        Playlists
      </h2>

      {playlistsQuery.error ? (
        <div className={styles.errorBanner} role="alert">
          <strong>Could not load playlists.</strong> {playlistsQuery.error.message}
        </div>
      ) : null}

      <div className={styles.layout}>
        {/* Playlist selector buttons live in this <aside>; E2E specs scope to it. */}
        <aside className={styles.sidebar}>
          <div className={styles.panel}>
            <h3 className={styles.panelTitle}>Create playlist</h3>

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
              className={styles.createForm}
            >
              <label htmlFor="playlist-name" className="sr-only">
                Playlist name
              </label>

              <input
                id="playlist-name"
                type="text"
                value={draftName}
                onChange={(event) => setDraftName(event.target.value)}
                placeholder="Late night discoveries"
                autoComplete="off"
                className={styles.input}
              />

              {createPlaylistMutation.error ? (
                <div className={styles.errorBanner} role="alert">
                  {createPlaylistMutation.error.message}
                </div>
              ) : null}

              <button
                type="submit"
                disabled={!draftName.trim() || createPlaylistMutation.isPending}
                className={styles.primaryButton}
              >
                <Plus size={15} />
                {createPlaylistMutation.isPending ? "Creating..." : "Create playlist"}
              </button>
            </form>
          </div>

          <div className={styles.panel}>
            <div className={styles.panelHeader}>
              <h3 className={styles.panelTitle}>Your playlists</h3>
              <span className={styles.count}>{playlists.length}</span>
            </div>

            {playlistsQuery.isLoading ? (
              <p className={styles.muted}>Loading playlists...</p>
            ) : playlists.length === 0 ? (
              <p className={styles.muted}>
                No playlists yet. Create one above and add tracks from Search.
              </p>
            ) : (
              <div className={styles.playlistList}>
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
                      aria-pressed={isSelected}
                      className={`${styles.playlistItem} ${isSelected ? styles.playlistItemSelected : ""}`}
                    >
                      <span className={styles.playlistDot} aria-hidden="true" />
                      <span className={styles.playlistItemText}>
                        <span className={styles.playlistName}>{playlist.name}</span>
                        <span className={styles.playlistDate}>
                          Created {formatDate(playlist.createdAt)}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </aside>

        <PlaylistDetailView
          key={selectedPlaylist?.id ?? "none"}
          playlist={selectedPlaylist}
          page={tracksPage}
          onPreviousPage={() =>
            setTracksPage((current) => Math.max(current - 1, 1))
          }
          onNextPage={() => setTracksPage((current) => current + 1)}
          onTrackRemoved={({ playlistId, page, removedLastItemFromPage }) => {
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
          onPlaylistDeleted={(playlistId) => {
            if (selectedPlaylistId === playlistId) {
              setSelectedPlaylistId(null);
              setTracksPage(1);
            }
          }}
        />
      </div>
    </section>
  );
}
