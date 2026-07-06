import { prisma } from "../lib/prisma.js";
import { GenreSource } from "../generated/prisma/enums.js";
import { deezerService } from "./deezer.service.js";

export interface TrackMetadataDto {
  id: string;
  userId: string;
  deezerTrackId: number;
  trackTitle: string;
  artistName: string;
  albumTitle: string;
  albumCoverUrl: string | null;
  previewUrl: string | null;
  deezerUrl: string | null;
  genre: string;
  genreSource: GenreSource;
  createdAt: Date;
  updatedAt: Date;
}

function toDto(row: {
  id: string;
  userId: string;
  deezerTrackId: number;
  trackTitle: string;
  artistName: string;
  albumTitle: string;
  albumCoverUrl: string | null;
  previewUrl: string | null;
  deezerUrl: string | null;
  genre: string;
  genreSource: GenreSource;
  createdAt: Date;
  updatedAt: Date;
}): TrackMetadataDto {
  return {
    id: row.id,
    userId: row.userId,
    deezerTrackId: row.deezerTrackId,
    trackTitle: row.trackTitle,
    artistName: row.artistName,
    albumTitle: row.albumTitle,
    albumCoverUrl: row.albumCoverUrl,
    previewUrl: row.previewUrl,
    deezerUrl: row.deezerUrl,
    genre: row.genre,
    genreSource: row.genreSource,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export class TrackMetadataService {
  private normalizeGenre(genre?: string): string {
    return typeof genre === "string" ? genre.trim() : "";
  }

  private async inferGenre(
    userId: string,
    deezerTrackId: number,
  ): Promise<{ genre: string; genreSource: GenreSource }> {
    const favorite = await prisma.favorite.findFirst({
      where: {
        userId,
        deezerTrackId,
        genre: {
          not: "unknown",
        },
      },
      select: {
        genre: true,
      },
    });

    if (favorite?.genre.trim()) {
      return {
        genre: favorite.genre,
        genreSource: GenreSource.FAVORITE_INFERRED,
      };
    }

    const previousEvent = await prisma.trackEvent.findFirst({
      where: {
        userId,
        deezerTrackId,
        genre: {
          not: "unknown",
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      select: {
        genre: true,
      },
    });

    if (previousEvent?.genre.trim()) {
      return {
        genre: previousEvent.genre,
        genreSource: GenreSource.EVENT_INFERRED,
      };
    }

    return {
      genre: "unknown",
      genreSource: GenreSource.UNKNOWN,
    };
  }

  async resolveTrackMetadata(
    userId: string,
    deezerTrackId: number,
    clientGenre?: string,
  ): Promise<TrackMetadataDto> {
    const normalizedClientGenre = this.normalizeGenre(clientGenre);

    const existing = await prisma.trackMetadata.findUnique({
      where: {
        userId_deezerTrackId: {
          userId,
          deezerTrackId,
        },
      },
    });

    if (existing) {
      if (
        normalizedClientGenre &&
        (
          existing.genre !== normalizedClientGenre ||
          existing.genreSource !== GenreSource.MANUAL
        )
      ) {
        const updated = await prisma.trackMetadata.update({
          where: {
            userId_deezerTrackId: {
              userId,
              deezerTrackId,
            },
          },
          data: {
            genre: normalizedClientGenre,
            genreSource: GenreSource.MANUAL,
          },
        });

        return toDto(updated);
      }

      if (existing.genre === "unknown" && !normalizedClientGenre) {
        const inferred = await this.inferGenre(userId, deezerTrackId);

        if (inferred.genre !== "unknown") {
          const updated = await prisma.trackMetadata.update({
            where: {
              userId_deezerTrackId: {
                userId,
                deezerTrackId,
              },
            },
            data: {
              genre: inferred.genre,
              genreSource: inferred.genreSource,
            },
          });

          return toDto(updated);
        }
      }

      return toDto(existing);
    }

    const track = await deezerService.getTrackById(deezerTrackId);

    if (!track) {
      throw new Error("TRACK_NOT_FOUND");
    }

    const resolvedGenre = normalizedClientGenre
      ? {
          genre: normalizedClientGenre,
          genreSource: GenreSource.MANUAL,
        }
      : await this.inferGenre(userId, deezerTrackId);

    const row = await prisma.trackMetadata.upsert({
      where: {
        userId_deezerTrackId: {
          userId,
          deezerTrackId,
        },
      },
      create: {
        userId,
        deezerTrackId,
        trackTitle: track.title,
        artistName: track.artistName,
        albumTitle: track.albumTitle,
        albumCoverUrl: track.coverUrl,
        previewUrl: track.previewUrl,
        deezerUrl: track.deezerUrl,
        genre: resolvedGenre.genre,
        genreSource: resolvedGenre.genreSource,
      },
      update: {
        trackTitle: track.title,
        artistName: track.artistName,
        albumTitle: track.albumTitle,
        albumCoverUrl: track.coverUrl,
        previewUrl: track.previewUrl,
        deezerUrl: track.deezerUrl,
        ...(normalizedClientGenre
          ? {
              genre: resolvedGenre.genre,
              genreSource: resolvedGenre.genreSource,
            }
          : {}),
      },
    });

    return toDto(row);
  }
}

export const trackMetadataService = new TrackMetadataService();