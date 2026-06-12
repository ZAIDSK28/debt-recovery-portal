// src/api/axiosInstance.ts
import axios, { AxiosError, AxiosHeaders, type InternalAxiosRequestConfig } from "axios";

const API_URL = import.meta.env.VITE_API_URL as string;

export const ACCESS_KEY = "drp_access";
export const REFRESH_KEY = "drp_refresh";
export const USER_KEY = "drp_user";
export const PENDING_OTP_KEY = "drp_pending_otp_username";
export const REQUEST_ID_HEADER = "x-request-id";

export function getStoredAccessToken(): string | null {
  return localStorage.getItem(ACCESS_KEY);
}

export function getStoredRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_KEY);
}

export function getStoredUser(): string | null {
  return localStorage.getItem(USER_KEY);
}

export function setAuthStorage(access: string, refresh: string, user?: string): void {
  localStorage.setItem(ACCESS_KEY, access);
  localStorage.setItem(REFRESH_KEY, refresh);
  if (user) {
    localStorage.setItem(USER_KEY, user);
  }
}

export function clearAuthStorage(): void {
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(PENDING_OTP_KEY);
}

let isRefreshing = false;
let pendingQueue: Array<(token: string | null) => void> = [];

function processQueue(token: string | null): void {
  pendingQueue.forEach((callback) => callback(token));
  pendingQueue = [];
}

function redirectToLogin(): void {
  if (typeof window === "undefined") return;
  if (window.location.pathname !== "/login") {
    window.location.href = "/login";
  }
}

function createRequestId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `req_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function readResponseRequestId(error: unknown): string | null {
  if (
    typeof error === "object" &&
    error !== null &&
    "response" in error &&
    typeof (error as { response?: unknown }).response === "object" &&
    (error as { response?: { headers?: Record<string, string | undefined> } }).response?.headers
  ) {
    const headers = (error as { response?: { headers?: Record<string, string | undefined> } }).response?.headers;
    return headers?.[REQUEST_ID_HEADER] ?? headers?.["X-Request-ID"] ?? null;
  }

  return null;
}

export const axiosInstance = axios.create({
  baseURL: API_URL,
});

axiosInstance.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = getStoredAccessToken();

  config.headers = config.headers ?? new AxiosHeaders();

  if (!config.headers.has("X-Request-ID")) {
    config.headers.set("X-Request-ID", createRequestId());
  }

  if (token) {
    config.headers.set("Authorization", `Bearer ${token}`);
  }

  return config;
});

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;
    const requestUrl = originalRequest?.url ?? "";

    if (error.response?.status !== 401 || !originalRequest || originalRequest._retry) {
      const requestId = readResponseRequestId(error);
      if (requestId && typeof console !== "undefined") {
        console.error("API request failed", { requestId, url: requestUrl, status: error.response?.status });
      }
      return Promise.reject(error);
    }

    if (requestUrl.includes("/auth/token/refresh/")) {
      clearAuthStorage();
      redirectToLogin();
      return Promise.reject(error);
    }

    const refreshToken = getStoredRefreshToken();

    if (!refreshToken) {
      clearAuthStorage();
      redirectToLogin();
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        pendingQueue.push((newToken) => {
          if (!newToken || !originalRequest) {
            reject(error);
            return;
          }

          originalRequest.headers = originalRequest.headers ?? new AxiosHeaders();
          originalRequest.headers.set("Authorization", `Bearer ${newToken}`);
          resolve(axiosInstance(originalRequest));
        });
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const response = await axios.post<{ access: string }>(`${API_URL}/auth/token/refresh/`, {
        refresh: refreshToken,
      });

      const newAccessToken = response.data.access;
      localStorage.setItem(ACCESS_KEY, newAccessToken);
      processQueue(newAccessToken);

      originalRequest.headers = originalRequest.headers ?? new AxiosHeaders();
      originalRequest.headers.set("Authorization", `Bearer ${newAccessToken}`);

      return axiosInstance(originalRequest);
    } catch (refreshError) {
      processQueue(null);
      clearAuthStorage();
      redirectToLogin();
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);