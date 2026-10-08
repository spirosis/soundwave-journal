import { AxiosError } from "axios";
import { apiClient } from "./client";

export type JournalEventType =
  | "PLAY"
  | "SKIP"
  | "COMPLETE"
  | "FAVORITE"
  | "UNFAVORITE";

export type JournalEventSource =
  | "search"
  | "recommendation"
  | "playlist"
  | "favorite";

export interface LogTrackEventPayload {
  deezerTrackId: number;
  eventType: JournalEventType;
  source: JournalEventSource;
  completionPct?: number;
  sessionId?: string;
  genre?: string;
}

export interface RecentTrackEvent {
  id: string;
  sessionId: string | null;
  deezerTrackId: number;
  trackTitle: string;
  artistName: string;
  genre: string;
  eventType: JournalEventType;
  completionPct: number;
  source: JournalEventSource;
  hourOfDay: number;
  dayOfWeek: number;
  createdAt: string;
  sessionLabel: string | null;
}

export interface JournalSummary {
  plays: number;
  completes: number;
  skips: number;
  favorites: number;
}

export interface TopGenreInsight {
  genre: string;
  plays: number;
  favorites: number;
  completes: number;
  skips: number;
  completionAvg: number;
  engagementScore: number;
}

export interface TopArtistInsight {
  artistName: string;
  plays: number;
  completes: number;
  favorites: number;
}

export interface JournalInsights {
  summary: JournalSummary;
  topGenres: TopGenreInsight[];
  topArtists: TopArtistInsight[];
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

export async function logTrackEvent(
  payload: LogTrackEventPayload
): Promise<void> {
  try {
    await apiClient.post("/journal/events", payload);
  } catch (error) {
    throw new Error(getApiErrorMessage(error, "Could not log track event"));
  }
}

export async function getRecentJournalEvents(
  limit = 12
): Promise<RecentTrackEvent[]> {
  try {
    const response = await apiClient.get<{
      events: RecentTrackEvent[];
    }>("/journal/recent", {
      params: { limit },
    });

    return response.data.events;
  } catch (error) {
    throw new Error(
      getApiErrorMessage(error, "Could not load recent journal events")
    );
  }
}

export async function getJournalInsights(): Promise<JournalInsights> {
  try {
    const response = await apiClient.get<JournalInsights>("/journal/insights");

    return response.data;
  } catch (error) {
    throw new Error(
      getApiErrorMessage(error, "Could not load journal insights")
    );
  }
}
