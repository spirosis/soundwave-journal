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
                className="rounded-xl border border-white/15 px-3 py-2 text-sm font-medium text-[#e7e2d6] transition hover:bg-white/10"
                aria-label={`Track actions for ${track.title}`}
            >
                ⋮
            </button>

            {isOpen ? (
                <div className="absolute right-0 z-20 mt-2 w-72 rounded-2xl border border-white/10 bg-[#152a20] p-3 shadow-[0_20px_45px_rgba(0,0,0,0.45)] backdrop-blur-xl">
                    <div className="border-b border-white/10 pb-3">
                        <p className="text-sm font-semibold text-[#f3efe4]">
                            Add to playlist
                        </p>
                        <p className="mt-1 text-xs text-[#9aa59a]">
                            {track.title} • {track.artistName}
                        </p>
                    </div>

                    <div className="mt-3 space-y-2">
                        {playlistsQuery.isLoading ? (
                            <p className="text-sm text-[#9aa59a]">Loading playlists...</p>
                        ) : playlistsQuery.error ? (
                            <div className="rounded-xl border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
                                {playlistsQuery.error.message}
                            </div>
                        ) : (playlistsQuery.data?.length ?? 0) === 0 ? (
                            <p className="text-sm text-[#9aa59a]">
                                No playlists yet. Create one in Library first.
                            </p>
                        ) : (
                            playlistsQuery.data?.map((playlist) => (
                                <button
                                    key={playlist.id}
                                    type="button"
                                    onClick={() => addToPlaylistMutation.mutate(playlist.id)}
                                    disabled={addToPlaylistMutation.isPending}
                                    className="block w-full rounded-xl border border-white/10 px-3 py-3 text-left text-sm text-[#e7e2d6] transition hover:border-white/20 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {playlist.name}
                                </button>
                            ))
                        )}
                    </div>

                    {addToPlaylistMutation.error ? (
                        <div className="mt-3 rounded-xl border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
                            {addToPlaylistMutation.error.message}
                        </div>
                    ) : null}

                    {addToPlaylistMutation.isPending ? (
                        <p className="mt-3 text-sm text-[#9aa59a]">Adding to playlist...</p>
                    ) : null}
                </div>
            ) : null}
        </div>
    );
}