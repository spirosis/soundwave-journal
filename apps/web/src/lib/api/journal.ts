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
