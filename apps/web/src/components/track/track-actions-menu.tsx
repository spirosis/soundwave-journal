"use client";

import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ListPlus } from "lucide-react";
import { addTrackToPlaylist, getPlaylists } from "../../lib/api/playlists";
import styles from "./track-actions-menu.module.css";

export interface TrackActionItem {
  id: number;
  title: string;
  artistName: string;
  albumTitle: string;
  coverUrl: string | null;
  previewUrl: string | null;
  durationSec: number;
}

interface TrackActionsMenuProps {
  track: TrackActionItem;
}

export function TrackActionsMenu({ track }: TrackActionsMenuProps) {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handlePointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const playlistsQuery = useQuery({
    queryKey: ["playlists"],
    queryFn: getPlaylists,
    enabled: isOpen,
  });

  const addToPlaylistMutation = useMutation({
    mutationFn: (playlistId: string) =>
      addTrackToPlaylist(playlistId, {
        deezerTrackId: track.id,
        trackTitle: track.title,
        artistName: track.artistName,
        albumCoverUrl: track.coverUrl,
        previewUrl: track.previewUrl,
        durationSec: track.durationSec,
      }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["playlists"] });
      void queryClient.invalidateQueries({ queryKey: ["playlist-tracks"] });
      setIsOpen(false);
    },
  });

  return (
    <div className={styles.container} ref={containerRef}>
      <button
        type="button"
        onClick={() => {
          addToPlaylistMutation.reset();
          setIsOpen((current) => !current);
        }}
        className={`${styles.trigger} ${isOpen ? styles.triggerOpen : ""}`}
        aria-label={`Track actions for ${track.title}`}
        aria-expanded={isOpen}
        aria-haspopup="dialog"
      >
        <ListPlus size={16} />
      </button>

      {isOpen ? (
        <div className={styles.panel} role="dialog" aria-label="Add to playlist">
          <div className={styles.panelHeader}>
            <p className={styles.panelTitle}>Add to playlist</p>
            <p className={styles.panelSubtitle}>
              {track.title} • {track.artistName}
            </p>
          </div>

          <div className={styles.list}>
            {playlistsQuery.isLoading ? (
              <p className={styles.muted}>Loading playlists...</p>
            ) : playlistsQuery.error ? (
              <div className={styles.error}>{playlistsQuery.error.message}</div>
            ) : (playlistsQuery.data?.length ?? 0) === 0 ? (
              <p className={styles.muted}>
                No playlists yet. Create one in Library first.
              </p>
            ) : (
              playlistsQuery.data?.map((playlist) => (
                <button
                  key={playlist.id}
                  type="button"
                  onClick={() => addToPlaylistMutation.mutate(playlist.id)}
                  disabled={addToPlaylistMutation.isPending}
                  className={styles.option}
                >
                  <span className={styles.optionDot} aria-hidden="true" />
                  {playlist.name}
                </button>
              ))
            )}
          </div>

          {addToPlaylistMutation.error ? (
            <div className={styles.error}>
              {addToPlaylistMutation.error.message}
            </div>
          ) : null}

          {addToPlaylistMutation.isPending ? (
            <p className={styles.muted}>Adding to playlist...</p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
