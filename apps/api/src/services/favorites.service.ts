import { prisma } from "../lib/prisma.js";
import { deezerService } from "./deezer.service.js";

export interface AddFavoriteDto {
    deezerTrackId: number;
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

export interface PaginatedFavoritesDto {
    items: FavoriteDto[];
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
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
    async getFavorites(
        userId: string,
        page: number,
        limit: number,
    ): Promise<PaginatedFavoritesDto> {
        const skip = (page - 1) * limit;

        const [rows, total] = await Promise.all([
            prisma.favorite.findMany({
                where: { userId },
                orderBy: { createdAt: "desc" },
                skip,
                take: limit,
            }),
            prisma.favorite.count({
                where: { userId },
            }),
        ]);

        return {
            items: rows.map(toDto),
            page,
            limit,
            total,
            hasMore: skip + rows.length < total,
        };
    }

    async addFavorite(userId: string, data: AddFavoriteDto): Promise<FavoriteDto> {
        
        const track = await deezerService.getTrackById(data.deezerTrackId);

        if(!track){
            throw new Error("TRACK_NOT_FOUND");
        }

        const updateData = {
            trackTitle: track.title,
            artistName: track.artistName,
            albumCoverUrl: track.coverUrl,
            previewUrl: track.previewUrl,
            ...(Object.prototype.hasOwnProperty.call(data, "genre")
                ? { genre: data.genre ?? "unknown" }
                : {}),
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
                trackTitle: track.title,
                artistName: track.artistName,
                albumCoverUrl: track.coverUrl,
                previewUrl: track.previewUrl,
                genre: data.genre ?? "unknown",
            },
            update: updateData,
        });

        return toDto(row);
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