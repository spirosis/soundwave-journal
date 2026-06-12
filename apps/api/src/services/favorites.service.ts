import { prisma } from "../lib/prisma.js";

export interface AddFavoriteDto {
    deezerTrackId: number;
    trackTitle: string;
    artistName: string;
    albumCoverUrl?: string;
    previewUrl?: string;
    genre?: string;
}

export interface FavoriteDto {
    id: string;
    deezerTrackId: number;
    trackTitle: string;
    artistName: string;
    albumCoverUrl: string | null;
    previewUrl: string | null;
    genre: string;
    createdAt: Date;
}

function toDto(row: {
    id: string;
    deezerTrackId: number;
    trackTitle: string;
    artistName: string;
    albumCoverUrl: string | null;
    previewUrl: string | null;
    genre: string;
    createdAt: Date;
}): FavoriteDto {
    return {
        id: row.id,
        deezerTrackId: row.deezerTrackId,
        trackTitle: row.trackTitle,
        artistName: row.artistName,
        albumCoverUrl: row.albumCoverUrl,
        previewUrl: row.previewUrl,
        genre: row.genre,
        createdAt: row.createdAt,
    };
}

export class FavoritesService {
    async getFavorites(userId: string): Promise<FavoriteDto[]> {
        const rows = await prisma.favorite.findMany({
            where: { userId },
            orderBy: { createdAt: "desc" },
        });

        return rows.map((toDto));
    }

    async addFavorite(userId: string, data: AddFavoriteDto): Promise<FavoriteDto> {
        const updateData = {
            trackTitle: data.trackTitle,
            artistName: data.artistName,
            ...(Object.prototype.hasOwnProperty.call(data, "albumCoverUrl")
         ? {albumCoverUrl: data.albumCoverUrl ?? null} : {}),
         ...(Object.prototype.hasOwnProperty.call(data, "previewUrl")
         ? {previewUrl: data.previewUrl ?? null} : {}),
         ...(Object.prototype.hasOwnProperty.call(data, "genre")
         ? {genre: data.genre ?? "unknown"} : {}), 
        };
        const row = await prisma.favorite.upsert({
            where: {
                userId_deezerTrackId: {
                    userId, deezerTrackId: data.deezerTrackId
                },
            },
            create: {
                userId,
                deezerTrackId: data.deezerTrackId,
                trackTitle: data.trackTitle,
                artistName: data.artistName,
                albumCoverUrl: data.albumCoverUrl ?? null,
                previewUrl: data.previewUrl ?? null,
                genre: data.genre ?? "unknown",
            },
            update: updateData,
        });

        return toDto(row)
    }

    async removeFavorite(userId: string, deezerTrackId: number): Promise<boolean> {
        const result = await prisma.favorite.deleteMany({
            where: {
                userId,
                deezerTrackId,
            },
        });

        return result.count > 0;
    }
}

export const favoritesService = new FavoritesService();