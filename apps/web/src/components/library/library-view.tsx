"use client";

import { useState } from "react";
import {
  keepPreviousData,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { HeartOff } from "lucide-react";
import { getFavorites, removeFavorite } from "../../lib/api/favorites";
import { formatDate } from "../../lib/format";
import { PreviewCover } from "../player/preview-cover";
import styles from "./library-view.module.css";

const PAGE_SIZE = 12;

export function LibraryView() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [pendingRemoveId, setPendingRemoveId] = useState<number | null>(null);

  const favoritesQuery = useQuery({
    queryKey: ["favorites", page, PAGE_SIZE],
    queryFn: () => getFavorites(page, PAGE_SIZE),
    placeholderData: keepPreviousData,
  });

  const removeMutation = useMutation({
    mutationFn: async (deezerTrackId: number) => {
      setPendingRemoveId(deezerTrackId);
      await removeFavorite(deezerTrackId);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["favorites"] });
    },
    onSettled: () => {
      setPendingRemoveId(null);
    },
  });

  const favorites = favoritesQuery.data?.items ?? [];
  const total = favoritesQuery.data?.total ?? 0;
  const hasMore = favoritesQuery.data?.hasMore ?? false;

  return (
    <section className={styles.section} aria-labelledby="favorites-heading">
      <div className={styles.header}>
        <div className={styles.headerText}>
          <h2 id="favorites-heading" className={styles.heading}>
            Favorites
          </h2>
          {favoritesQuery.data ? (
            <span className={styles.count}>{total}</span>
          ) : null}
        </div>

        {total > PAGE_SIZE ? (
          <div className={styles.pagination}>
            <span className={styles.pageLabel}>Page {page}</span>
            <button
              type="button"
              onClick={() => setPage((current) => Math.max(current - 1, 1))}
              disabled={page === 1 || favoritesQuery.isFetching}
              className={styles.pageButton}
            >
              Previous
            </button>
            <button
              type="button"
              onClick={() => setPage((current) => current + 1)}
              disabled={!hasMore || favoritesQuery.isFetching}
              className={styles.pageButton}
            >
              Next
            </button>
          </div>
        ) : null}
      </div>

      {removeMutation.error ? (
        <div className={styles.errorBanner} role="alert">
          {removeMutation.error.message}
        </div>
      ) : null}

      {favoritesQuery.isLoading ? (
        <div className={styles.list} aria-busy="true">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className={`${styles.card} ${styles.skeleton}`}>
              <span className={styles.skeletonCover} />
              <span className={styles.skeletonLines}>
                <span />
                <span />
              </span>
            </div>
          ))}
        </div>
      ) : favoritesQuery.error ? (
        <div className={styles.errorBanner} role="alert">
          <strong>Could not load favorites.</strong> {favoritesQuery.error.message}
        </div>
      ) : favorites.length === 0 ? (
        <div className={styles.empty}>
          <h3>No favorites yet</h3>
          <p>Save tracks from Search and they&apos;ll gather here.</p>
        </div>
      ) : (
        <div className={styles.list}>
          {favorites.map((favorite) => {
            const isRemoving = pendingRemoveId === favorite.deezerTrackId;

            return (
              <article key={favorite.id} className={styles.card}>
                <PreviewCover
                  track={{
                    id: favorite.deezerTrackId,
                    title: favorite.trackTitle,
                    artistName: favorite.artistName,
                    coverUrl: favorite.albumCoverUrl,
                    previewUrl: favorite.previewUrl,
                  }}
                  source="favorite"
                  size={64}
                />

                <div className={styles.info}>
                  <p className={styles.title}>{favorite.trackTitle}</p>
                  <p className={styles.artist}>{favorite.artistName}</p>
                  <div className={styles.meta}>
                    <span className={`${styles.chip} ${styles.genreChip}`}>
                      {favorite.genre}
                    </span>
                    <span className={styles.chip}>
                      Added {formatDate(favorite.createdAt)}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => removeMutation.mutate(favorite.deezerTrackId)}
                  disabled={isRemoving}
                  className={styles.removeButton}
                >
                  <HeartOff size={15} />
                  {isRemoving ? "Removing..." : "Remove favorite"}
                </button>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
