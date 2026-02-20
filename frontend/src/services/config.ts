export interface ApiConfig {
  functionAppUrl: string;
}

export function getApiConfig(): ApiConfig {
  const functionAppUrl = import.meta.env.VITE_FUNCTION_APP_URL || 'http://localhost:7071';
  
  return {
    functionAppUrl
  };
}
