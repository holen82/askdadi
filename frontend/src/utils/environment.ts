/**
 * Environment configuration
 */
export interface EnvironmentConfig {
  functionAppUrl: string;
  frontendUrl: string;
  isDevelopment: boolean;
  isProduction: boolean;
}

/**
 * Get the Function App origin (used for /.auth/ redirects)
 */
export function getFunctionAppUrl(): string {
  const envUrl = import.meta.env.VITE_FUNCTION_APP_URL;
  return envUrl || window.location.origin;
}

/**
 * Get the API base URL (includes /api prefix)
 */
export function getApiBaseUrl(): string {
  return getFunctionAppUrl() + '/api';
}

/**
 * Get the frontend URL (for auth redirects)
 */
export function getFrontendUrl(): string {
  const envUrl = import.meta.env.VITE_FRONTEND_URL;
  return envUrl || window.location.origin;
}

/**
 * Get environment configuration
 */
export function getEnvironmentConfig(): EnvironmentConfig {
  const functionAppUrl = getApiBaseUrl();
  const frontendUrl = getFrontendUrl();
  const mode = import.meta.env.MODE || 'development';

  return {
    functionAppUrl,
    frontendUrl,
    isDevelopment: mode === 'development',
    isProduction: mode === 'production'
  };
}
