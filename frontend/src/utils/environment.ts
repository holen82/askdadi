/**
 * Environment configuration
 */
export interface EnvironmentConfig {
  functionAppUrl: string;
  isDevelopment: boolean;
  isProduction: boolean;
}

/**
 * Get environment configuration
 */
export function getEnvironmentConfig(): EnvironmentConfig {
  const functionAppUrl = import.meta.env.VITE_FUNCTION_APP_URL || 'http://localhost:7071';
  const mode = import.meta.env.MODE || 'development';

  return {
    functionAppUrl,
    isDevelopment: mode === 'development',
    isProduction: mode === 'production'
  };
}
