"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { History, Search as SearchIcon, X } from "lucide-react";
import { searchTracks } from "../../lib/api/search";
import {
  addFavorite,
  getFavorites,
  removeFavorite,
} from "../../lib/api/favorites";
import { TrackActionsMenu } from "../track/track-actions-menu";
import styles from "./search-view.module.css";

const RECENT_SEARCHES_KEY = "soundwave:recent-searches";
const MAX_RECENT_SEARCHES = 8;

function loadRecentSearches(): string[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(RECENT_SEARCHES_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === "string")
      : [];
  } catch {
    return [];
  }
}

function saveRecentSearches(searches: string[]): void {
  try {
    window.localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(searches));
  } catch {
    // localStorage unavailable (private mode, quota, etc.) — recent searches just won't persist.
  }
}

function formatDuration(durationSec: number): string {
  const minutes = Math.floor(durationSec / 60);
  const seconds = durationSec % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

export function SearchView() {
  const queryClient = useQueryClient();
  const [draftQuery, setDraftQuery] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState("");
  const [recentSearches, setRecentSearches] = useState<string[]>(() =>
    loadRecentSearches()
  );
  const [pendingFavoriteIds, setPendingFavoriteIds] = useState<Set<number>>(
    () => new Set()
  );
  const [favoriteOverrides, setFavoriteOverrides] = useState<Map<number, boolean>>(
    new Map()
  );

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
    mutationFn: async ({
      deezerTrackId,
      shouldFavorite,
    }: {
      deezerTrackId: number;
      shouldFavorite: boolean;
    }) => {
      if (shouldFavorite) {
        return addFavorite(deezerTrackId);
      }

      await removeFavorite(deezerTrackId);
      return { deezerTrackId };
    },
    onMutate: ({ deezerTrackId, shouldFavorite }) => {
      setPendingFavoriteIds((current) => {
        const next = new Set(current);
        next.add(deezerTrackId);
        return next;
      });

      setFavoriteOverrides((current) => {
        const next = new Map(current);
        next.set(deezerTrackId, shouldFavorite);
        return next;
      });
    },
    onError: (_error, variables) => {
      setFavoriteOverrides((current) => {
        const next = new Map(current);
        next.delete(variables.deezerTrackId);
        return next;
      });
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["favorites"] });
    },
    onSettled: (_data, _error, variables) => {
      setPendingFavoriteIds((current) => {
        const next = new Set(current);
        next.delete(variables.deezerTrackId);
        return next;
      });

      setFavoriteOverrides((current) => {
        const next = new Map(current);
        next.delete(variables.deezerTrackId);
        return next;
      });
    },
  });

  const tracks = searchQuery.data?.data ?? [];

  const favoritedIds = useMemo(() => {
    const ids = new Set<number>();

    for (const favorite of favoritesQuery.data?.items ?? []) {
      ids.add(favorite.deezerTrackId);
    }

    // MVP limitation: this only hydrates the first 100 favorites for initial button state.
    for (const [deezerTrackId, isFavorited] of favoriteOverrides.entries()) {
      if (isFavorited) {
        ids.add(deezerTrackId);
      } else {
        ids.delete(deezerTrackId);
      }
    }

    return ids;
  }, [favoritesQuery.data?.items, favoriteOverrides]);

  function recordRecentSearch(query: string) {
    setRecentSearches((current) => {
      const deduped = current.filter(
        (item) => item.toLowerCase() !== query.toLowerCase()
      );
      const next = [query, ...deduped].slice(0, MAX_RECENT_SEARCHES);
      saveRecentSearches(next);
      return next;
    });
  }

  function runSearch(query: string) {
    const trimmed = query.trim();

    if (!trimmed) {
      return;
    }

    setDraftQuery(trimmed);
    setSubmittedQuery(trimmed);
    recordRecentSearch(trimmed);
  }

  function clearSearch() {
    setDraftQuery("");
    setSubmittedQuery("");
  }

  function clearRecentSearches() {
    setRecentSearches([]);
    saveRecentSearches([]);
  }

  return (
    <div className={styles.section}>
      <div className={styles.intro}>
        <p className={styles.eyebrow}>FIND YOUR SOUND</p>
        <h1>Search tracks &amp; artists</h1>
        <p className={styles.introDescription}>
          Busca por canción o artista contra el catálogo real de Deezer. Esta
          búsqueda no incluye journals ni playlists.
        </p>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            runSearch(draftQuery);
          }}
          className={styles.form}
        >
          <label className={styles.inputWrap}>
            <SearchIcon size={18} />
            <input
              id="search-query"
              type="text"
              value={draftQuery}
              onChange={(event) => setDraftQuery(event.target.value)}
              placeholder="Busca por canción o artista"
            />
            {draftQuery ? (
              <button
                type="button"
                onClick={clearSearch}
                className={styles.clearButton}
                aria-label="Clear search"
              >
                <X size={16} />
              </button>
            ) : null}
          </label>

          <button
            type="submit"
            disabled={!draftQuery.trim() || searchQuery.isFetching}
            className={styles.submitButton}
          >
            {searchQuery.isFetching ? "Searching..." : "Search"}
          </button>
        </form>
      </div>

      {searchQuery.error ? (
        <div className={styles.errorBanner}>{searchQuery.error.message}</div>
      ) : null}

      {favoritesQuery.error ? (
        <div className={styles.warnBanner}>{favoritesQuery.error.message}</div>
      ) : null}

      {favoriteMutation.error ? (
        <div className={styles.errorBanner}>{favoriteMutation.error.message}</div>
      ) : null}

      {!submittedQuery ? (
        <section className={styles.section}>
          <div className={styles.sectionHeaderRow}>
            <h2>Recent searches</h2>
            {recentSearches.length > 0 ? (
              <button
                type="button"
                onClick={clearRecentSearches}
                className={styles.clearRecentButton}
              >
                Clear
              </button>
            ) : null}
          </div>

          {recentSearches.length === 0 ? (
            <p className={styles.emptyText}>
              Tus búsquedas recientes de canciones y artistas van a aparecer
              acá.
            </p>
          ) : (
            <div className={styles.recentList}>
              {recentSearches.map((query) => (
                <button
                  key={query}
                  type="button"
                  onClick={() => runSearch(query)}
                  className={styles.recentChip}
                >
                  <History size={14} />
                  {query}
                </button>
              ))}
            </div>
          )}
        </section>
      ) : null}

      {submittedQuery && searchQuery.isLoading ? (
        <div className={styles.stateCard}>
          <h3>Loading results...</h3>
        </div>
      ) : null}

      {submittedQuery && !searchQuery.isLoading && !searchQuery.error && tracks.length === 0 ? (
        <div className={styles.stateCard}>
          <h3>No results</h3>
          <p>
            La búsqueda no devolvió tracks. Prueba otra combinación de
            artista o track.
          </p>
        </div>
      ) : null}

      {tracks.length > 0 ? (
        <section className={styles.resultsList}>
          {tracks.map((track) => (
            <article key={track.id} className={styles.resultCard}>
              <div className={styles.resultCover}>
                {track.coverUrl ? (
                  <Image
                    src={track.coverUrl}
                    alt={`${track.title} cover`}
                    width={88}
                    height={88}
                    className="h-22 w-22 object-cover"
                    unoptimized
                  />
                ) : (
                  <div className={styles.resultCoverPlaceholder}>No cover</div>
                )}
              </div>

              <div className={styles.resultInfo}>
                <p className={styles.resultTitle}>{track.title}</p>
                <p className={styles.resultArtist}>{track.artistName}</p>
                <p className={styles.resultAlbum}>{track.albumTitle}</p>

                <div className={styles.resultMeta}>
                  <span className={styles.metaChip}>
                    {formatDuration(track.durationSec)}
                  </span>
                  <span className={styles.metaChip}>Track #{track.id}</span>
                  <span className={styles.metaChip}>
                    {track.previewUrl ? "Preview available" : "No preview"}
                  </span>
                </div>
              </div>

              <div className={styles.resultActions}>
                <TrackActionsMenu
                  track={{
                    id: track.id,
                    title: track.title,
                    artistName: track.artistName,
                    albumTitle: track.albumTitle,
                    coverUrl: track.coverUrl,
                    previewUrl: track.previewUrl,
                    durationSec: track.durationSec,
                  }}
                />

                {track.previewUrl ? (
                  <audio
                    controls
                    preload="none"
                    src={track.previewUrl}
                    className={styles.audio}
                  />
                ) : null}

                <button
                  type="button"
                  onClick={() => {
                    favoriteMutation.reset();
                    favoriteMutation.mutate({
                      deezerTrackId: track.id,
                      shouldFavorite: !favoritedIds.has(track.id),
                    });
                  }}
                  disabled={pendingFavoriteIds.has(track.id) || favoritesQuery.isLoading}
                  className={styles.favoriteButton}
                >
                  {pendingFavoriteIds.has(track.id)
                    ? favoriteOverrides.get(track.id)
                      ? "Saving..."
                      : "Removing..."
                    : favoritesQuery.isLoading
                      ? "Checking..."
                      : favoritedIds.has(track.id)
                        ? "Remove favorite"
                        : "Favorite"}
                </button>

                {track.deezerUrl ? (
                  <a
                    href={track.deezerUrl}
                    target="_blank"
                    rel="noreferrer"
                    className={styles.deezerLink}
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
