"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ExternalLink,
  Heart,
  History,
  Search as SearchIcon,
  X,
} from "lucide-react";
import { searchTracks } from "../../lib/api/search";
import {
  addFavorite,
  getFavorites,
  removeFavorite,
} from "../../lib/api/favorites";
import { logTrackEvent } from "../../lib/api/journal";
import { formatDuration } from "../../lib/format";
import { PageHeader } from "../app/page-header";
import { PreviewCover } from "../player/preview-cover";
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

type SearchEventSource = "search" | "recommendation";

interface SearchViewProps {
  initialQuery?: string;
  initialSource?: SearchEventSource;
}

export function SearchView({
  initialQuery = "",
  initialSource = "search",
}: SearchViewProps) {
  const queryClient = useQueryClient();
  const [draftQuery, setDraftQuery] = useState(initialQuery);
  const [submittedQuery, setSubmittedQuery] = useState(initialQuery);
  const [eventSource, setEventSource] =
    useState<SearchEventSource>(initialSource);
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
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: ["favorites"] });

      void logTrackEvent({
        deezerTrackId: variables.deezerTrackId,
        eventType: variables.shouldFavorite ? "FAVORITE" : "UNFAVORITE",
        source: eventSource,
      }).catch(() => {
        // Telemetry failures shouldn't disrupt the favorite action itself.
      });
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

  function runSearch(
    query: string,
    source: SearchEventSource = "search"
  ) {
    const trimmed = query.trim();

    if (!trimmed) {
      return;
    }

    setDraftQuery(trimmed);
    setSubmittedQuery(trimmed);
    setEventSource(source);
    recordRecentSearch(trimmed);
  }

  function clearSearch() {
    setDraftQuery("");
    setSubmittedQuery("");
    setEventSource("search");
  }

  function clearRecentSearches() {
    setRecentSearches([]);
    saveRecentSearches([]);
  }

  const showResults = tracks.length > 0;

  return (
    <div className={styles.view}>
      <PageHeader
        eyebrow={eventSource === "recommendation" ? "From your recommendations" : "Search"}
        title="Find your next trace."
        lead="Tracks and artists from Deezer's real catalog. Play a 30-second preview and it becomes part of your journal."
      />

      <form
        onSubmit={(event) => {
          event.preventDefault();
          runSearch(draftQuery);
        }}
        className={styles.form}
        role="search"
      >
        <label className={styles.inputWrap}>
          <SearchIcon size={18} className={styles.inputIcon} />
          <input
            id="search-query"
            type="text"
            value={draftQuery}
            onChange={(event) => setDraftQuery(event.target.value)}
            placeholder="Track or artist"
            autoComplete="off"
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

      {searchQuery.error ? (
        <div className={styles.errorBanner} role="alert">
          {searchQuery.error.message}
        </div>
      ) : null}

      {favoritesQuery.error ? (
        <div className={styles.warnBanner}>{favoritesQuery.error.message}</div>
      ) : null}

      {favoriteMutation.error ? (
        <div className={styles.errorBanner} role="alert">
          {favoriteMutation.error.message}
        </div>
      ) : null}

      {!submittedQuery ? (
        <section className={styles.recent}>
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
              Your recent track and artist searches will show up here.
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
        <div className={styles.resultsList} aria-busy="true">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className={`${styles.resultCard} ${styles.skeleton}`}>
              <span className={styles.skeletonCover} />
              <span className={styles.skeletonLines}>
                <span />
                <span />
              </span>
            </div>
          ))}
        </div>
      ) : null}

      {submittedQuery && !searchQuery.isLoading && !searchQuery.error && tracks.length === 0 ? (
        <div className={styles.stateCard}>
          <h3>No results</h3>
          <p>Nothing came back for that. Try another artist or track name.</p>
        </div>
      ) : null}

      {showResults ? (
        <section className={styles.results} aria-label="Search results">
          <p className={styles.resultsCount}>
            {searchQuery.data?.total ?? tracks.length} results
          </p>

          <div className={styles.resultsList}>
            {tracks.map((track) => {
              const isFavorited = favoritedIds.has(track.id);
              const isPending = pendingFavoriteIds.has(track.id);

              return (
                <article key={track.id} className={styles.resultCard}>
                  <PreviewCover
                    track={{
                      id: track.id,
                      title: track.title,
                      artistName: track.artistName,
                      coverUrl: track.coverUrl,
                      previewUrl: track.previewUrl,
                    }}
                    source={eventSource}
                  />

                  <div className={styles.resultInfo}>
                    <p className={styles.resultTitle}>{track.title}</p>
                    <p className={styles.resultArtist}>{track.artistName}</p>
                    <p className={styles.resultAlbum}>{track.albumTitle}</p>

                    <div className={styles.resultMeta}>
                      <span className={styles.metaChip}>
                        {formatDuration(track.durationSec)}
                      </span>
                      {!track.previewUrl ? (
                        <span className={styles.metaChip}>No preview</span>
                      ) : null}
                      {track.deezerUrl ? (
                        <a
                          href={track.deezerUrl}
                          target="_blank"
                          rel="noreferrer"
                          className={styles.deezerLink}
                        >
                          Open in Deezer
                          <ExternalLink size={12} />
                        </a>
                      ) : null}
                    </div>
                  </div>

                  <div className={styles.resultActions}>
                    <button
                      type="button"
                      onClick={() => {
                        favoriteMutation.reset();
                        favoriteMutation.mutate({
                          deezerTrackId: track.id,
                          shouldFavorite: !isFavorited,
                        });
                      }}
                      disabled={isPending || favoritesQuery.isLoading}
                      className={`${styles.favoriteButton} ${isFavorited ? styles.favorited : ""}`}
                    >
                      <Heart
                        size={15}
                        className={styles.heart}
                        fill={isFavorited ? "currentColor" : "none"}
                      />
                      {isPending
                        ? favoriteOverrides.get(track.id)
                          ? "Saving..."
                          : "Removing..."
                        : favoritesQuery.isLoading
                          ? "Checking..."
                          : isFavorited
                            ? "Remove favorite"
                            : "Favorite"}
                    </button>

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
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      ) : null}
    </div>
  );
}
