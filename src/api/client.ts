import axios, { AxiosError, type AxiosInstance, type AxiosRequestConfig, type InternalAxiosRequestConfig } from 'axios';
import type { ApiError, RequestOptions } from './interface';
import { getMementoClientHeaders } from './client-metadata';
import { normalizeApiError } from './contract-adapter';
import { authService } from '@/utility/auth-service';

const getAuthToken = (): string | null => {
  return authService.getAuthData()?.access_token || null;
};

export const updateAuthToken = (token: string | null) => {
  const current = authService.getAuthData();
  if (!current || !token) {
    if (!token) authService.clearAuth();
    return;
  }
  authService.setAuthData({ ...current, access_token: token });
};

const baseURL = import.meta.env.VITE_API_BASE_URL;

const client: AxiosInstance = axios.create({
  baseURL: baseURL,
  timeout: 30000, // 30 seconds
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...getMementoClientHeaders(),
  },
});

client.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const requestConfig = config as InternalAxiosRequestConfig & { skipAuth?: boolean };

    // Skip auth if explicitly requested (e.g., login, register)
    if (!requestConfig.skipAuth) {
      const token = await getAuthToken();
      if (token) {
        config.headers.authorization = `Bearer ${token}`;
      }
    }

    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
client.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error: AxiosError<ApiError>) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { skipErrorHandling?: boolean };

    // Skip error handling if explicitly requested
    if (originalRequest?.skipErrorHandling) {
      return Promise.reject(error);
    }

    // Handle errors
    const apiError: ApiError = normalizeApiError(
      error.response?.data,
      error.response?.status,
      error.message || 'An error occurred',
    );

    return Promise.reject(apiError);
  }
);

// Helper function to make requests with type-safe options
export const apiRequest = async <T = unknown>(
  config: AxiosRequestConfig & RequestOptions
): Promise<T> => {
  const { skipAuth, skipErrorHandling, ...axiosConfig } = config;

  const response = await client.request<T>({
    ...axiosConfig,
    skipAuth,
    skipErrorHandling,
  } as AxiosRequestConfig);

  // Return data from response
  return response.data;
};

export default client;
