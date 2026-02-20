import { getApiBaseUrl } from '@/utils/environment';

export interface ApiConfig {
  functionAppUrl: string;
}

export function getApiConfig(): ApiConfig {
  const functionAppUrl = getApiBaseUrl();
  
  return {
    functionAppUrl
  };
}
