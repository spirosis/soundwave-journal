import { AxiosError } from "axios";
import { apiClient } from "./client";

export interface Genre {
  id: number;
  name: string;
  pictureUrl: string | null;
}

interface GenresResponse {
  data: Genre[];
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

export async function getGenres(): Promise<Genre[]> {
  try {
    const response = await apiClient.get<GenresResponse>("/discovery/genres");

    // Deezer's genre list includes an "All" sentinel (id 0) that isn't a
    // real genre and would search for the literal word "All".
    return response.data.data.filter((genre) => genre.id !== 0);
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "Could not load genres"));
  }
}
