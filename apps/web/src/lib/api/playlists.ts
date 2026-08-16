import { AxiosError } from "axios";
import { apiClient } from "./client";

export interface Playlist {
  id: string;
  name: string;
  isPublic: boolean;
  shareToken: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PlaylistTrack {
  id: string;
  deezerTrackId: number;
  trackTitle: string;
  artistName: string;
  albumCoverUrl: string | null;
  previewUrl: string | null;
  durationSec: number;
  position: number;
  addedAt: string;
}

interface AddTrackToPlaylistPayload {
  deezerTrackId: number;
  trackTitle: string;
  artistName: string;
  albumCoverUrl?: string | null;
  previewUrl?: string | null;
  durationSec?: number;
}

export interface PaginatedPlaylistTracks {
  items: PlaylistTrack[];
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
}

interface CreatePlaylistPayload {
  name: string;
  isPublic?: boolean;
}

interface ApiErrorResponse {
  error?: string;
}

function getApiErrorMessage(error: unknown, fallbackMessage: string): string {
  if (error instanceof AxiosError) {
    const data = error.response?.data as ApiErrorResponse | undefined;

    if (typeof data?.error === "string" && data.error.trim()) {
      return data.error;
    }
  }

  return fallbackMessage;
}

export async function getPlaylists(): Promise<Playlist[]> {
  try {
    const response = await apiClient.get<Playlist[]>("/playlists");
    return response.data;
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "Could not load playlists"));
  }
}

export async function createPlaylist(
  payload: CreatePlaylistPayload
): Promise<Playlist> {
  try {
    const response = await apiClient.post<Playlist>("/playlists", payload);
    return response.data;
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "Could not create playlist"));
  }
}

export async function getPlaylistTracks(
  playlistId: string,
  page = 1,
  limit = 20
): Promise<PaginatedPlaylistTracks> {
  try {
    const response = await apiClient.get<PaginatedPlaylistTracks>(
      `/playlists/${playlistId}/tracks`,
      {
        params: { page, limit },
      }
    );

    return response.data;
  } catch (error) {
    throw new Error(
      getApiErrorMessage(error, "Could not load playlist tracks")
    );
  }
}

export async function addTrackToPlaylist(
  playlistId: string,
  payload: AddTrackToPlaylistPayload
): Promise<PlaylistTrack> {
  try {
    const response = await apiClient.post<PlaylistTrack>(
      `/playlists/${playlistId}/tracks`,
      payload
    );

    return response.data;
  } catch (error) {
    throw new Error(
      getApiErrorMessage(error, "Could not add track to playlist")
    );
  }
}