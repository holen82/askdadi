import { getApiBaseUrl } from '@/utils/environment';

export interface IdeaRecord {
  id: string;
  text: string;
  author: string;
  authorEmail: string;
  timestamp: string;
}

export interface SubmitIdeaResponse {
  id: string;
  message: string;
}

class IdeaService {
  private apiBaseUrl: string;

  constructor() {
    this.apiBaseUrl = getApiBaseUrl();
  }

  async submitIdea(text: string): Promise<SubmitIdeaResponse> {
    const bypassAuth = import.meta.env.VITE_BYPASS_AUTH_FOR_LOCAL_DEV === 'true';

    const response = await fetch(`${this.apiBaseUrl}/ideas`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: bypassAuth ? 'omit' : 'include',
      body: JSON.stringify({ text }),
    });

    if (response.status === 401) throw new Error('Ikke autorisert. Logg inn på nytt.');
    if (response.status === 403) throw new Error('Du har ikke tilgang til denne funksjonen.');
    if (response.status === 400) {
      const data = await response.json().catch(() => ({ message: 'Ugyldig forespørsel.' }));
      throw new Error(data.message || 'Ugyldig forespørsel.');
    }
    if (!response.ok) throw new Error(`Kunne ikke lagre idé (${response.status}).`);

    return response.json();
  }

  async listIdeas(): Promise<IdeaRecord[]> {
    const bypassAuth = import.meta.env.VITE_BYPASS_AUTH_FOR_LOCAL_DEV === 'true';

    const response = await fetch(`${this.apiBaseUrl}/ideas`, {
      method: 'GET',
      credentials: bypassAuth ? 'omit' : 'include',
    });

    if (response.status === 401) throw new Error('Ikke autorisert. Logg inn på nytt.');
    if (response.status === 403) throw new Error('Du har ikke tilgang til denne funksjonen.');
    if (!response.ok) throw new Error(`Kunne ikke hente ideer (${response.status}).`);

    return response.json();
  }

  async deleteIdea(id: string): Promise<void> {
    const bypassAuth = import.meta.env.VITE_BYPASS_AUTH_FOR_LOCAL_DEV === 'true';

    const response = await fetch(`${this.apiBaseUrl}/ideas/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      credentials: bypassAuth ? 'omit' : 'include',
    });

    if (response.status === 401) throw new Error('Ikke autorisert. Logg inn på nytt.');
    if (response.status === 403) throw new Error('Du har ikke tilgang til denne funksjonen.');
    if (response.status === 404) throw new Error('Idéen ble ikke funnet.');
    if (!response.ok) throw new Error(`Kunne ikke slette idé (${response.status}).`);
  }
}

export const ideaService = new IdeaService();
