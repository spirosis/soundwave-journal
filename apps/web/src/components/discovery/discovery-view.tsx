"use client";

import Image from "next/image";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "../app/page-header";
import { getGenres } from "../../lib/api/discovery";
import styles from "./discovery-view.module.css";

export function DiscoveryView() {
  const genresQuery = useQuery({
    queryKey: ["discovery", "genres"],
    queryFn: getGenres,
  });

  const genres = genresQuery.data ?? [];

  return (
    <>
      <PageHeader
        eyebrow="Discovery"
        title="Pick a direction."
        lead="Every genre opens a real search in Deezer's catalog — the same results you'd get by typing it yourself, nothing pre-baked."
      />

      {genresQuery.isLoading ? (
        <div className={styles.constellation} aria-busy="true">
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className={styles.tile}>
              <span className={`${styles.orb} ${styles.orbSkeleton}`} />
              <span className={styles.nameSkeleton} />
            </div>
          ))}
        </div>
      ) : genresQuery.error ? (
        <section className={styles.notice} role="alert">
          <h2>Could not load genres</h2>
          <p>{genresQuery.error.message}</p>
        </section>
      ) : genres.length === 0 ? (
        <section className={styles.notice}>
          <p>No genres available right now.</p>
        </section>
      ) : (
        <nav className={styles.constellation} aria-label="Genres">
          {genres.map((genre) => (
            <Link
              key={genre.id}
              href={`/search?q=${encodeURIComponent(genre.name)}`}
              className={styles.tile}
            >
              <span className={styles.orb}>
                {genre.pictureUrl ? (
                  <Image
                    src={genre.pictureUrl}
                    alt=""
                    fill
                    sizes="(min-width: 1024px) 160px, 40vw"
                    className={styles.orbImage}
                    unoptimized
                  />
                ) : (
                  <span className={styles.orbInitial} aria-hidden="true">
                    {genre.name.charAt(0)}
                  </span>
                )}
              </span>
              <span className={styles.name}>{genre.name}</span>
            </Link>
          ))}
        </nav>
      )}
    </>
  );
}
