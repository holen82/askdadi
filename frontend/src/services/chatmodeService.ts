import { getApiBaseUrl } from '@/utils/environment';

export interface ChatModeResponse {
  chatMode: string;
}

class ChatmodeService {
  private apiBaseUrl: string;

  constructor() {
    this.apiBaseUrl = getApiBaseUrl();
  }

  async getChatMode(): Promise<string> {
    const bypassAuth = import.meta.env.VITE_BYPASS_AUTH_FOR_LOCAL_DEV === 'true';

    const response = await fetch(`${this.apiBaseUrl}/userprefs/chatmode`, {
      method: 'GET',
      credentials: bypassAuth ? 'omit' : 'include',
    });

    if (response.status === 401) throw new Error('Ikke autorisert. Logg inn på nytt.');
    if (response.status === 403) throw new Error('Du har ikke tilgang til denne funksjonen.');
    if (!response.ok) throw new Error(`Kunne ikke hente chatmodus (${response.status}).`);

    const data: ChatModeResponse = await response.json();
    return data.chatMode;
  }

  async setChatMode(mode: string): Promise<string> {
    const bypassAuth = import.meta.env.VITE_BYPASS_AUTH_FOR_LOCAL_DEV === 'true';

    const response = await fetch(`${this.apiBaseUrl}/userprefs/chatmode`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: bypassAuth ? 'omit' : 'include',
      body: JSON.stringify({ chatMode: mode }),
    });

    if (response.status === 401) throw new Error('Ikke autorisert. Logg inn på nytt.');
    if (response.status === 403) throw new Error('Du har ikke tilgang til denne funksjonen.');
    if (response.status === 400) {
      const data = await response.json().catch(() => ({ message: 'Ugyldig forespørsel.' }));
      throw new Error(data.message || 'Ugyldig forespørsel.');
    }
    if (!response.ok) throw new Error(`Kunne ikke sette chatmodus (${response.status}).`);

    const data: ChatModeResponse = await response.json();
    return data.chatMode;
  }
}

export const chatmodeService = new ChatmodeService();
