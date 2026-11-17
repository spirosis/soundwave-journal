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

// A 401 from these endpoints is the answer itself (bad credentials, no
// session); retrying them after a refresh would only replace the real error
// with the refresh's one.
const NON_RETRYABLE_AUTH_PATHS = [
  "/auth/login",
  "/auth/register",
  "/auth/refresh",
  "/auth/logout",
];

function isNonRetryableAuthRequest(config: InternalAxiosRequestConfig): boolean {
  const url = config.url ?? "";
  return NON_RETRYABLE_AUTH_PATHS.some((path) => url.endsWith(path));
}

// No request may hang forever: an unanswered call would leave the UI stuck on
// "Restoring your session" or on a spinner with no way out.
const API_REQUEST_TIMEOUT_MS = 15_000;
const REFRESH_REQUEST_TIMEOUT_MS = 8_000;
// Longer than the refresh request itself, so a healthy tab holding the lock
// always finishes first; only a frozen or orphaned holder makes us give up.
const REFRESH_LOCK_WAIT_MS = 10_000;

export const apiClient = axios.create({
  baseURL: apiBaseUrl,
  withCredentials: true,
  timeout: API_REQUEST_TIMEOUT_MS,
});

const refreshClient = axios.create({
  baseURL: apiBaseUrl,
  withCredentials: true,
  timeout: REFRESH_REQUEST_TIMEOUT_MS,
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

  const controller = new AbortController();
  let lockWaitTimedOut = false;
  const timer = setTimeout(() => {
    lockWaitTimedOut = true;
    controller.abort();
  }, REFRESH_LOCK_WAIT_MS);

  try {
    return await navigator.locks.request(
      REFRESH_LOCK_NAME,
      { mode: "exclusive", signal: controller.signal },
      async () => {
        // The signal only cancels a pending lock request; once granted the
        // refresh is bounded by its own request timeout.
        clearTimeout(timer);
        return runRefreshRequest();
      }
    );
  } catch (error) {
    // Another tab holds the lock and is not releasing it (frozen, paused or
    // orphaned). Refreshing without coordination can at worst cost that tab
    // its session, which beats every other tab hanging indefinitely.
    if (lockWaitTimedOut) {
      return runRefreshRequest();
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
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

    if (
      !originalRequest ||
      error.response?.status !== 401 ||
      isNonRetryableAuthRequest(originalRequest)
    ) {
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