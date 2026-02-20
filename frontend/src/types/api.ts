/**
 * API error response type
 */
export interface ApiError {
  error: string;
  message: string;
}

/**
 * Generic API response wrapper
 */
export interface ApiResponse<T> {
  data?: T;
  error?: ApiError;
}

/**
 * Configuration for API services
 */
export interface ServiceConfig {
  baseUrl: string;
  timeout?: number;
  retries?: number;
}
