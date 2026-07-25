import { AxiosError } from "axios";
import { apiClient } from "./client";

export interface SearchTrack {
  id: number;
  title: string;
  artistName: string;
  albumTitle: string;
  previewUrl: string | null;
  durationSec: number;
  coverUrl: string | null;
  deezerUrl: string | null;
}

export interface SearchResponse {
  data: SearchTrack[];
  total: number;
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

export async function searchTracks(query: string): Promise<SearchResponse> {
  try {
    const response = await apiClient.get<SearchResponse>("/search", {
      params: { q: query },
    });

    return response.data;
  } catch (error) {
    throw new Error(
      getApiErrorMessage(error, "Could not search tracks")
    );
  }
}