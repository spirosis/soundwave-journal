"use client";

import Image from "next/image";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { getGenres } from "../../lib/api/discovery";

export function DiscoveryView() {
  const genresQuery = useQuery({
    queryKey: ["discovery", "genres"],
    queryFn: getGenres,
  });

  if (genresQuery.isLoading) {
    return (
      <section className="rounded-[28px] border border-stone-300 bg-white p-6 shadow-sm">
        <p className="text-sm text-stone-600">Loading genres...</p>
      </section>
    );
  }

  if (genresQuery.error) {
    return (
      <section className="rounded-[28px] border border-red-200 bg-red-50 p-6 shadow-sm">
        <h3 className="text-xl font-semibold text-red-900">
          Could not load genres
        </h3>
        <p className="mt-3 text-sm leading-7 text-red-700">
          {genresQuery.error.message}
        </p>
      </section>
    );
  }

  const genres = genresQuery.data ?? [];

  if (genres.length === 0) {
    return (
      <section className="rounded-[28px] border border-stone-300 bg-white p-6 shadow-sm">
        <p className="text-sm text-stone-600">No genres available right now.</p>
      </section>
    );
  }

  return (
    <section className="rounded-[28px] border border-stone-300 bg-white p-6 shadow-sm">
      <h3 className="text-xl font-semibold tracking-tight text-stone-950">
        Explore genres
      </h3>
      <p className="mt-2 text-sm text-stone-600">
        Pick a genre to search its catalog.
      </p>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
        {genres.map((genre) => (
          <Link
            key={genre.id}
            href={`/search?q=${encodeURIComponent(genre.name)}`}
            className="group overflow-hidden rounded-2xl border border-stone-300 bg-stone-50 transition hover:border-stone-950 hover:bg-white"
          >
            <div className="relative aspect-square w-full bg-stone-200">
              {genre.pictureUrl ? (
                <Image
                  src={genre.pictureUrl}
                  alt=""
                  fill
                  sizes="(min-width: 768px) 25vw, 50vw"
                  className="object-cover"
                  unoptimized
                />
              ) : null}
            </div>
            <p className="px-3 py-3 text-sm font-medium text-stone-900">
              {genre.name}
            </p>
          </Link>
        ))}
      </div>
    </section>
  );
}
