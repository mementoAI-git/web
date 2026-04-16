import axios, { AxiosError, type AxiosInstance, type AxiosRequestConfig, type InternalAxiosRequestConfig } from 'axios';
import { storageKeys } from '@/utility/constant';
import type { ApiError, RequestOptions } from './interface';

const getAuthToken = (): string | null => {
  const auth = localStorage.getItem(storageKeys.auth);
  return auth ? JSON.parse(auth).access_token : null;
};

export const updateAuthToken = (token: string | null) => {
  localStorage.setItem(storageKeys.auth, JSON.stringify({ access_token: token }));
};

const baseURL = import.meta.env.VITE_API_BASE_URL;

const client: AxiosInstance = axios.create({
  baseURL: baseURL,
  timeout: 30000, // 30 seconds
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
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
    const apiError: ApiError = {
      message: error.response?.data?.message || error.message || 'An error occurred',
      status: error.response?.status,
      errors: error.response?.data?.errors,
    };

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

