import { prisma } from "../lib/prisma.js";

export interface CreatePlaylistDto {
  name: string;
  isPublic?: boolean;
}

export interface AddPlaylistTrackDto {
  deezerTrackId: number;
  trackTitle: string;
  artistName: string;
  albumCoverUrl?: string;
  previewUrl?: string;
  durationSec?: number;
}

export interface PlaylistTrackDto {
  id: string;
  deezerTrackId: number;
  trackTitle: string;
  artistName: string;
  albumCoverUrl: string | null;
  previewUrl: string | null;
  durationSec: number;
  position: number;
  addedAt: Date;
}

export interface PlaylistDto {
  id: string;
  name: string;
  isPublic: boolean;
  shareToken: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface PlaylistDetailDto extends PlaylistDto {
  tracks: PlaylistTrackDto[];
}

function toPlaylistDto(row: {
  id: string;
  name: string;
  isPublic: boolean;
  shareToken: string | null;
  createdAt: Date;
  updatedAt: Date;
}): PlaylistDto {
  return {
    id: row.id,
    name: row.name,
    isPublic: row.isPublic,
    shareToken: row.shareToken,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function toPlaylistTrackDto(row: {
  id: string;
  deezerTrackId: number;
  trackTitle: string;
  artistName: string;
  albumCoverUrl: string | null;
  previewUrl: string | null;
  durationSec: number;
  position: number;
  addedAt: Date;
}): PlaylistTrackDto {
  return {
    id: row.id,
    deezerTrackId: row.deezerTrackId,
    trackTitle: row.trackTitle,
    artistName: row.artistName,
    albumCoverUrl: row.albumCoverUrl,
    previewUrl: row.previewUrl,
    durationSec: row.durationSec,
    position: row.position,
    addedAt: row.addedAt,
  };
}

export class PlaylistsService {
  async getPlaylists(userId: string): Promise<PlaylistDto[]> {
    const rows = await prisma.playlist.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    return rows.map(toPlaylistDto);
  }

  private async getOwnedPlaylistOrThrow(userId: string, playlistId: string) {
    const playlist = await prisma.playlist.findFirst({
      where: {
        id: playlistId,
        userId,
      },
      select: { id: true }
    });
    if (!playlist) {
      throw new Error("PLAYLIST_NOT_FOUND");
    }

    return playlist;
  }

  async createPlaylist(userId: string, data: CreatePlaylistDto): Promise<PlaylistDto> {
    const row = await prisma.playlist.create({
      data: {
        userId,
        name: data.name,
        isPublic: data.isPublic ?? false,
      },
    });

    return toPlaylistDto(row);
  }

  async getPlaylistById(userId: string, playlistId: string): Promise<PlaylistDetailDto | null> {
    const row = await prisma.playlist.findFirst({
      where: {
        id: playlistId,
        userId,
      },
      include: {
        tracks: {
          orderBy: { position: "asc" },
        },
      },
    });

    if (!row) {
      return null;
    }

    return {
      ...toPlaylistDto(row),
      tracks: row.tracks.map(toPlaylistTrackDto),
    };
  }

  async addTrackToPlaylist(
    userId: string,
    playlistId: string,
    data: AddPlaylistTrackDto
  ): Promise<PlaylistTrackDto> {
    await this.getOwnedPlaylistOrThrow(userId, playlistId);

    const existing = await prisma.playlistTrack.findUnique({
      where: {
        playlistId_deezerTrackId: {
          playlistId,
          deezerTrackId: data.deezerTrackId,
        }
      }
    });

    if (existing) {
      throw new Error("TRACK_ALREADY_IN_PLAYLIST");
    }

    const maxPositionRow = await prisma.playlistTrack.aggregate({
      where: { playlistId },
      _max: { position: true },
    });

    const nextPosition = (maxPositionRow._max.position ?? 0) + 1;

    const row = await prisma.playlistTrack.create({
      data: {
        playlistId,
        deezerTrackId: data.deezerTrackId,
        trackTitle: data.trackTitle,
        artistName: data.artistName,
        albumCoverUrl: data.albumCoverUrl ?? null,
        previewUrl: data.previewUrl ?? null,
        durationSec: data.durationSec ?? 30,
        position: nextPosition,
      },
    });
    return toPlaylistTrackDto(row);
  }

  async reorderTracks(
    userId: string,
    playlistId: string,
    deezerTrackIds: number[],
  ): Promise<void> {
    await this.getOwnedPlaylistOrThrow(userId, playlistId);

    const existing = await prisma.playlistTrack.findMany({
      where: { playlistId },
      select: { deezerTrackId: true },
    });

    const existingIds = existing.map((track) => track.deezerTrackId).sort((a, b) => a - b);
    const requestedIds = [...deezerTrackIds].sort((a, b) => a - b);
    const requestedSet = new Set(deezerTrackIds);

    if (
      requestedSet.size !== deezerTrackIds.length
    ) {
      throw new Error("REORDER_ID_MISMATCH");
    }

    const sameIds = existingIds.length === requestedIds.length && existingIds.every((id, index) => id === requestedIds[index]);

    if (!sameIds) {
      throw new Error("REORDER_ID_MISMATCH");
    }


    /**
     * Mueve los tracks a -1, -2,... segunda pasada los deja: 1, 2,...
     * Como las posiciones temporales no chocan con las finales positivas, evitas colisiones intermedias del índice único.
     */
    await prisma.$transaction([
      ...deezerTrackIds.map((deezerTrackId, index) =>
        prisma.playlistTrack.update({
          where: {
            playlistId_deezerTrackId: {
              playlistId, deezerTrackId
            }
          },
          data: {
            position: -(index + 1)
          },
        })
      ),
      ...deezerTrackIds.map((deezerTrackId, index) => prisma.playlistTrack.update({
        where: {
          playlistId_deezerTrackId: {
            playlistId,
            deezerTrackId,
          },
        },

        data: {
          position: index + 1,
        }
      })),
    ]);
  }

  /**
   * Este metodo "removeTrackFromPlaylist" verifica que la
   * playlist sea del usuario,
   * Busca el track dentro de la playlist
   * si no existe, devuelve false
   * si existe la elimina y baja 1 posicion de los tracks
   * que estaban despues
   */
  async removeTrackFromPlaylist(
    userId: string,
    playlistId: string,
    deezerTrackId: number,
  ): Promise<boolean> {
    await this.getOwnedPlaylistOrThrow(userId, playlistId);

    const existing = await prisma.playlistTrack.findUnique({
      where: {
        playlistId_deezerTrackId: {
          playlistId,
          deezerTrackId,
        },
      },
    });

    if (!existing) {
      return false;
    }

    await prisma.$transaction([
      prisma.playlistTrack.delete({
        where: {
          playlistId_deezerTrackId: {
            playlistId,
            deezerTrackId,
          },
        },
      }),
      prisma.playlistTrack.updateMany({
        where: {
          playlistId,
          position: {
            gt: existing.position,
          },
        },
        data: {
          position: {
            decrement: 1,
          },
        },
      }),
    ]);

    return true;
  }

}

export const playlistsService = new PlaylistsService();