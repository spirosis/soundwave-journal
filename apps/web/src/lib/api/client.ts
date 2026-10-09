import axios, {
  AxiosError,
  type InternalAxiosRequestConfig,
} from "axios";
import { useAuthStore } from "../store/auth";

const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL;

if (!apiBaseUrl) {
  throw new Error("Missing NEXT_PUBLIC_API_URL");
}

interface RefreshResponse {
  accessToken: string;
}

type RetryableRequestConfig = InternalAxiosRequestConfig & {
  _retry?: boolean;
};

export const apiClient = axios.create({
  baseURL: apiBaseUrl,
  withCredentials: true,
});

const refreshClient = axios.create({
  baseURL: apiBaseUrl,
  withCredentials: true,
});

const REFRESH_LOCK_NAME = "soundwave-journal:refresh";
let refreshPromise: Promise<string> | null = null;

async function runRefreshRequest(): Promise<string> {
  const response = await refreshClient.post<RefreshResponse>("/auth/refresh");
  return response.data.accessToken;
}

async function runRefreshWithTabLock(): Promise<string> {
  if (typeof navigator === "undefined" || !navigator.locks) {
    return runRefreshRequest();
  }

  return navigator.locks.request(
    REFRESH_LOCK_NAME,
    { mode: "exclusive" },
    async () => runRefreshRequest()
  );
}

export async function refreshAccessToken(): Promise<string> {
  if (!refreshPromise) {
    refreshPromise = runRefreshWithTabLock().finally(() => {
      refreshPromise = null;
    });
  }

  return refreshPromise;
}

apiClient.interceptors.request.use((config) => {
  const accessToken = useAuthStore.getState().accessToken;

  if (accessToken) {
    config.headers.set("Authorization", `Bearer ${accessToken}`);
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetryableRequestConfig | undefined;

    if (!originalRequest || error.response?.status !== 401) {
      return Promise.reject(error);
    }

    if (originalRequest._retry) {
      useAuthStore.getState().clear();
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      const newAccessToken = await refreshAccessToken();
      useAuthStore.getState().setAccessToken(newAccessToken);

      originalRequest.headers.set("Authorization", `Bearer ${newAccessToken}`);

      return apiClient(originalRequest);
    } catch (refreshError) {
      useAuthStore.getState().clear();
      return Promise.reject(refreshError);
    }
  }
);