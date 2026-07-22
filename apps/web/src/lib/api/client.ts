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

let refreshPromise: Promise<string> | null = null;

async function runRefreshRequest(): Promise<string> {
  const response = await refreshClient.post<RefreshResponse>("/auth/refresh");
  return response.data.accessToken;
}

async function getRefreshedAccessToken(): Promise<string> {
  if (!refreshPromise) {
    refreshPromise = runRefreshRequest().finally(() => {
      refreshPromise = null;
    });
  }

  return refreshPromise;
}

export const apiClient = axios.create({
  baseURL: apiBaseUrl,
  withCredentials: true,
});

const refreshClient = axios.create({
  baseURL: apiBaseUrl,
  withCredentials: true,
});

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
      const newAccessToken = await getRefreshedAccessToken();
      useAuthStore.getState().setAccessToken(newAccessToken);

      originalRequest.headers.set("Authorization", `Bearer ${newAccessToken}`);

      return apiClient(originalRequest);
    } catch (refreshError) {
      useAuthStore.getState().clear();
      return Promise.reject(refreshError);
    }
  }
);