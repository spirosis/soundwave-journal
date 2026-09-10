import { AxiosError } from "axios";
import { apiClient } from "./client";

export type RateLimitPolicyName = "public" | "authWrite" | "refresh";

export interface RateLimitPolicyStatus {
  name: RateLimitPolicyName;
  windowMs: number;
  limit: number;
  used: number;
  remaining: number;
  resetAt: string;
}

export interface RateLimitStatusResponse {
  subject: {
    type: "ip";
    id?: string;
  };
  generatedAt: string;
  policies: RateLimitPolicyStatus[];
}

interface RateLimitTimeline {
  requestPattern: Array<{
    atMs: number;
    count: number;
    note: string;
  }>;
  totalAcceptedAcrossBoundary: number;
  burstRisk: string;
}

export interface RateLimitComparisonResponse {
  generatedAt: string;
  comparedPolicy: {
    name: RateLimitPolicyName;
    windowMs: number;
    limit: number;
  };
  currentImplementation: {
    algorithm: "fixed-window";
    runtime: "express-rate-limit";
    store: "in-memory";
    isActiveRuntimeImplementation: boolean;
    strengths: string[];
    limitations: string[];
  };
  conceptualComparison: {
    fixedWindow: {
      summary: string;
      example: RateLimitTimeline;
    };
    slidingWindow: {
      summary: string;
      example: RateLimitTimeline;
    };
  };
  portfolioPositioning: {
    today: string;
    nextStep: string;
  };
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

export async function getRateLimitStatus(): Promise<RateLimitStatusResponse> {
  try {
    const response = await apiClient.get<RateLimitStatusResponse>(
      "/rate-limit/status"
    );

    return response.data;
  } catch (error) {
    throw new Error(
      getApiErrorMessage(error, "Could not load rate limit status")
    );
  }
}

export async function getRateLimitComparison(
  policy: RateLimitPolicyName
): Promise<RateLimitComparisonResponse> {
  try {
    const response = await apiClient.get<RateLimitComparisonResponse>(
      "/rate-limit/compare",
      {
        params: { policy },
      }
    );

    return response.data;
  } catch (error) {
    throw new Error(
      getApiErrorMessage(error, "Could not load rate limit comparison")
    );
  }
}