/**
 * Environment configuration
 */
export interface EnvironmentConfig {
  functionAppUrl: string;
  isDevelopment: boolean;
  isProduction: boolean;
}

/**
 * Get the API base URL
 */
export function getApiBaseUrl(): string {
  const envUrl = import.meta.env.VITE_FUNCTION_APP_URL;
  return envUrl || window.location.origin;
}

/**
 * Get environment configuration
 */
export function getEnvironmentConfig(): EnvironmentConfig {
  const functionAppUrl = getApiBaseUrl();
  const mode = import.meta.env.MODE || 'development';

  return {
    functionAppUrl,
    isDevelopment: mode === 'development',
    isProduction: mode === 'production'
  };
}
