import { AxiosError } from "axios";
import { apiClient } from "./client";
import type { AuthUser } from "../store/auth";

interface AuthSuccessResponse {
  user: AuthUser;
  accessToken: string;
}

interface RefreshResponse {
  accessToken: string;
}

interface MeResponse {
  user: AuthUser;
}

interface ApiErrorResponse {
  error?: string;
}

export interface AuthPayload {
  email: string;
  password: string;
  displayName?: string;
}

function getApiErrorMessage(
  error: unknown,
  fallbackMessage: string
): string {
  if (error instanceof AxiosError) {
    const data = error.response?.data as ApiErrorResponse | undefined;
    if (typeof data?.error === "string" && data.error.trim()) {
      return data.error;
    }
  }

  return fallbackMessage;
}

export async function register(payload: AuthPayload): Promise<AuthSuccessResponse> {
  try {
    const response = await apiClient.post<AuthSuccessResponse>("/auth/register", payload);
    return response.data;
  } catch (error) {
    throw new Error(
      getApiErrorMessage(error, "Could not register user")
    );
  }
}

export async function login(
  email: string,
  password: string
): Promise<AuthSuccessResponse> {
  try {
    const response = await apiClient.post<AuthSuccessResponse>("/auth/login", {
      email,
      password,
    });

    return response.data;
  } catch (error) {
    throw new Error(
      getApiErrorMessage(error, "Could not log in")
    );
  }
}

export async function refresh(): Promise<RefreshResponse> {
  try {
    const response = await apiClient.post<RefreshResponse>("/auth/refresh");
    return response.data;
  } catch (error) {
    throw new Error(
      getApiErrorMessage(error, "Could not refresh session")
    );
  }
}

export async function getMe(): Promise<AuthUser> {
  try {
    const response = await apiClient.get<MeResponse>("/auth/me");
    return response.data.user;
  } catch (error) {
    throw new Error(
      getApiErrorMessage(error, "Could not load current user")
    );
  }
}

export async function logout(): Promise<void> {
  try {
    await apiClient.post("/auth/logout");
  } catch (error) {
    throw new Error(
      getApiErrorMessage(error, "Could not log out")
    );
  }
}