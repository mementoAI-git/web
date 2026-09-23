import { del, patch, post, put, get } from '@/api/mutations';
import type { ApiError, ApiResponse } from '@/api/interface';
import { useStore } from '@/hooks/use-store';
import { useCallback } from 'react';
import useSWR, { mutate } from 'swr';
import useSWRMutation from 'swr/mutation'
import { toast } from 'sonner';
import endpoints from '@/api/endpoint';
import { replacePathParams } from '@/utility';
import { useNavigate } from 'react-router-dom';

export type MutationMethod = 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'GET';

export function useApi<T = unknown>(
  endpoint: string | null,
  options?: {
    skipErrorHandling?: boolean;
    onError?: (error: ApiError) => void;
    onSuccess?: (data: ApiResponse<T>) => void;
    pathParams?: Record<string, string | number>;
  }
) {
  const navigate = useNavigate();
  const { unsetAuth } = useStore();
  const { skipErrorHandling = true, onError, onSuccess, pathParams } = options || {};

  // Replace path parameters in endpoint if provided
  const resolvedEndpoint = endpoint && pathParams
    ? replacePathParams(endpoint, pathParams)
    : endpoint;

  const { data, error, isLoading, mutate: swrMutate, isValidating } = useSWR<ApiResponse<T>, ApiError>(
    resolvedEndpoint,
    {
      onError: (error: ApiError) => {
        // Handle 401 Unauthorized - redirect to login
        if (error.status === 401 && endpoint !== endpoints.login) {
          unsetAuth();
          navigate('/login');
          if (!skipErrorHandling) {
            toast.error('Session expired. Please login again.');
          }
        } else if (!skipErrorHandling) {
          toast.error(error.message || 'An error occurred');
        }
        onError?.(error);
      },
      onSuccess: (data: ApiResponse<T>) => {
        onSuccess?.(data);
      },
    }
  );

  return {
    data,
    error,
    isLoading,
    isValidating,
    mutate: swrMutate,
  };
}

export function useMutation<TResponse = unknown, TRequest = unknown>(
  endpoint: string,
  options?: {
    skipErrorHandling?: boolean;
    onSuccess?: (data: ApiResponse<TResponse>) => void;
    onError?: (error: ApiError) => void;
    method?: MutationMethod;
    invalidate?: string[]; // SWR keys to invalidate after successful mutation
  }
) {
  const navigate = useNavigate();
  const { unsetAuth } = useStore();
  const { skipErrorHandling, onSuccess, onError, method = 'POST', invalidate = [] } = options || {};

  // Mutation fetcher function
  const mutationFetcher = useCallback(
    async (
      key: string,
      { arg }: { arg: { data?: TRequest; pathParams?: Record<string, string | number> } }
    ): Promise<ApiResponse<TResponse>> => {
      let url = key;

      // Replace path parameters if provided
      if (arg.pathParams) {
        url = replacePathParams(key, arg.pathParams);
      }

      switch (method) {
        case 'GET':
          return get<TResponse>(url);
        case 'PUT':
          return put<TResponse, TRequest>(url, arg.data);
        case 'PATCH':
          return patch<TResponse, TRequest>(url, arg.data);
        case 'DELETE':
          return del<TResponse>(url);
        case 'POST':
        default:
          return post<TResponse, TRequest>(url, arg.data);
      }
    },
    [method]
  );

  const { trigger, data, error, isMutating, reset } = useSWRMutation(
    endpoint,
    mutationFetcher
  );

  // Wrapped mutate function that accepts the same signature as before
  const executeMutation = useCallback(
    async (
      data?: TRequest,
      pathParams?: Record<string, string | number>
    ): Promise<ApiResponse<TResponse> | undefined> => {
      try {
        const result = await trigger({ data, pathParams });

        // Invalidate specified SWR keys to refetch data
        if (invalidate.length > 0) {
          await Promise.all(invalidate.map(key => mutate(k => typeof k === "string" && k.startsWith(key))));
        }

        onSuccess?.(result);
        return result;
      } catch (error) {
        const apiError = error as ApiError;

        // Handle 401 Unauthorized - redirect to login
        if (apiError.status === 401 && endpoint !== endpoints.login) {
          unsetAuth();
          navigate('/login');
          if (!skipErrorHandling) {
            toast.error('Session expired. Please login again.');
          }
        } else if (!skipErrorHandling) {
          toast.error(apiError.message || 'An error occurred');
        }

        onError?.(apiError);
        if (!skipErrorHandling) {
          throw error;
        }
      }
    },
    [trigger, invalidate, onSuccess, onError, skipErrorHandling, toast, navigate, unsetAuth]
  );

  return {
    trigger: executeMutation,
    data,
    error,
    isLoading: isMutating,
    reset,
  };
}
