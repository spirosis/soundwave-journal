import { AxiosError } from "axios";
import { apiClient } from "./client";

export interface WeeklySummary {
  plays: number;
  completes: number;
  skips: number;
  favorites: number;
}

export interface WeeklyTopGenre {
  genre: string;
  plays: number;
  completes: number;
  favorites: number;
}

export interface WeeklyTopArtist {
  artistName: string;
  plays: number;
  completes: number;
  favorites: number;
}

export interface WeeklyAnalytics {
  weekStart: string;
  weekEnd: string;
  summary: WeeklySummary;
  topGenres: WeeklyTopGenre[];
  topArtists: WeeklyTopArtist[];
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

export async function getWeeklyAnalytics(): Promise<WeeklyAnalytics> {
  try {
    const response = await apiClient.get<WeeklyAnalytics>("/analytics/weekly");

    return response.data;
  } catch (error) {
    throw new Error(
      getApiErrorMessage(error, "Could not load weekly analytics")
    );
  }
}
