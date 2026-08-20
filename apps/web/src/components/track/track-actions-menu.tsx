"use client";

import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
    addTrackToPlaylist,
    getPlaylists,
} from "../../lib/api/playlists";

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
        <div className="relative" ref={containerRef}>
            <button
                type="button"
                onClick={() => {
                    addToPlaylistMutation.reset();
                    setIsOpen((current) => !current);
                }}
                className="rounded-xl border border-stone-300 px-3 py-2 text-sm font-medium text-stone-900 transition hover:bg-stone-100"
                aria-label={`Track actions for ${track.title}`}
            >
                ⋮
            </button>

            {isOpen ? (
                <div className="absolute right-0 z-20 mt-2 w-72 rounded-2xl border border-stone-300 bg-white p-3 shadow-lg">
                    <div className="border-b border-stone-200 pb-3">
                        <p className="text-sm font-semibold text-stone-950">
                            Add to playlist
                        </p>
                        <p className="mt-1 text-xs text-stone-500">
                            {track.title} • {track.artistName}
                        </p>
                    </div>

                    <div className="mt-3 space-y-2">
                        {playlistsQuery.isLoading ? (
                            <p className="text-sm text-stone-600">Loading playlists...</p>
                        ) : playlistsQuery.error ? (
                            <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                                {playlistsQuery.error.message}
                            </div>
                        ) : (playlistsQuery.data?.length ?? 0) === 0 ? (
                            <p className="text-sm text-stone-600">
                                No playlists yet. Create one in Library first.
                            </p>
                        ) : (
                            playlistsQuery.data?.map((playlist) => (
                                <button
                                    key={playlist.id}
                                    type="button"
                                    onClick={() => addToPlaylistMutation.mutate(playlist.id)}
                                    disabled={addToPlaylistMutation.isPending}
                                    className="block w-full rounded-xl border border-stone-200 px-3 py-3 text-left text-sm text-stone-900 transition hover:border-stone-300 hover:bg-stone-100 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {playlist.name}
                                </button>
                            ))
                        )}
                    </div>

                    {addToPlaylistMutation.error ? (
                        <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                            {addToPlaylistMutation.error.message}
                        </div>
                    ) : null}

                    {addToPlaylistMutation.isPending ? (
                        <p className="mt-3 text-sm text-stone-600">Adding to playlist...</p>
                    ) : null}
                </div>
            ) : null}
        </div>
    );
}