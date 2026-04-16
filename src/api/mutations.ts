import { type AxiosRequestConfig } from 'axios';
import client from './client';
import type { ApiResponse, RequestOptions } from './interface';


export const get = async <T = unknown>(
  url: string,
  config?: AxiosRequestConfig & RequestOptions
): Promise<ApiResponse<T>> => {
  const response = await client.get<ApiResponse<T>>(url, config);

  return response.data as ApiResponse<T>;
};

/**
 * Helper function for POST requests
 */
export const post = async <T = unknown, D = unknown>(
  url: string,
  data?: D,
  config?: AxiosRequestConfig & RequestOptions
): Promise<ApiResponse<T>> => {
  const response = await client.post<ApiResponse<T>>(url, data, config);

  return response.data as ApiResponse<T>;
};

/**
 * Helper function for PUT requests
 */
export const put = async <T = unknown, D = unknown>(
  url: string,
  data?: D,
  config?: AxiosRequestConfig & RequestOptions
): Promise<ApiResponse<T>> => {
  const response = await client.put<ApiResponse<T>>(url, data, config);

  return response.data as ApiResponse<T>;
};

/**
 * Helper function for PATCH requests
 */
export const patch = async <T = unknown, D = unknown>(
  url: string,
  data?: D,
  config?: AxiosRequestConfig & RequestOptions
): Promise<ApiResponse<T>> => {
  const response = await client.patch<ApiResponse<T>>(url, data, config);

  return response.data as ApiResponse<T>;
};

/**
 * Helper function for DELETE requests
 */
export const del = async <T = unknown>(
  url: string,
  config?: AxiosRequestConfig & RequestOptions
): Promise<ApiResponse<T>> => {
  const response = await client.delete<ApiResponse<T>>(url, config);
  return response.data as ApiResponse<T>;
};

