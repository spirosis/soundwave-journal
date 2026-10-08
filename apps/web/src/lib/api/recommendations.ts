import { AxiosError } from "axios";
import { apiClient } from "./client";

export interface GenreRecommendation {
  genre: string;
  score: number;
  reason: string;
}

export interface RecommendationMetrics {
  recommendationFavoriteRate: number | null;
  recommendationCompleteRate: number | null;
  recommendationSkipRate: number | null;
  recommendationPlayCount: number;
}

interface RecommendationsResponse {
  recommendations: GenreRecommendation[];
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

export async function getRecommendations(): Promise<GenreRecommendation[]> {
  try {
    const response = await apiClient.get<RecommendationsResponse>(
      "/recommendations"
    );

    return response.data.recommendations;
  } catch (error) {
    throw new Error(
      getApiErrorMessage(error, "Could not load recommendations")
    );
  }
}

export async function getRecommendationMetrics(): Promise<RecommendationMetrics> {
  try {
    const response = await apiClient.get<RecommendationMetrics>(
      "/recommendations/metrics"
    );

    return response.data;
  } catch (error) {
    throw new Error(
      getApiErrorMessage(error, "Could not load recommendation metrics")
    );
  }
}
