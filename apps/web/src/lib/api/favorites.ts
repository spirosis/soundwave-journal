import { AxiosError } from "axios";
import { apiClient } from "./client";

export interface Favorite {
  id: string;
  deezerTrackId: number;
  trackTitle: string;
  artistName: string;
  albumCoverUrl: string | null;
  previewUrl: string | null;
  genre: string;
  createdAt: string;
}

export interface PaginatedFavorites {
  items: Favorite[];
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
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

export async function getFavorites(page = 1, limit = 20): Promise<PaginatedFavorites> {
  try {
    const response = await apiClient.get<PaginatedFavorites>("/favorites", {
      params: { page, limit },
    });

    return response.data;
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "Could not load favorites"));
  }
}

export async function addFavorite(deezerTrackId: number, genre?: string): Promise<Favorite> {
  try {
    const response = await apiClient.post<Favorite>("/favorites", {
      deezerTrackId,
      ...(genre ? { genre } : {}),
    });

    return response.data;
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "Could not add favorite"));
  }
}

export async function removeFavorite(deezerTrackId: number): Promise<void> {
  try {
    await apiClient.delete(`/favorites/${deezerTrackId}`);
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "Could not remove favorite"));
  }
}
