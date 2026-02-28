import { registerTool, type ToolContext } from './toolRegistry';
import { getApiBaseUrl } from '@/utils/environment';

const MAX_TITLE_CHARS = 256;

export function registerIssueTools(): void {
  registerTool({
    name: 'issue',
    description: 'Opprett et GitHub-issue for dette prosjektet',
    usage: '<tittel>',
    minArgs: 1,
    async execute(args: string, context: ToolContext): Promise<void> {
      if (args.length > MAX_TITLE_CHARS) {
        context.setError(`Tittelen er for lang. Maks ${MAX_TITLE_CHARS} tegn tillatt.`);
        return;
      }

      const bypassAuth = import.meta.env.VITE_BYPASS_AUTH_FOR_LOCAL_DEV === 'true';

      try {
        const response = await fetch(`${getApiBaseUrl()}/issues`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: bypassAuth ? 'omit' : 'include',
          body: JSON.stringify({ title: args }),
        });

        if (response.status === 401) throw new Error('Ikke autorisert. Logg inn på nytt.');
        if (response.status === 403) throw new Error('Du har ikke tilgang til denne funksjonen.');
        if (response.status === 503) throw new Error('GitHub-integrasjon er ikke konfigurert.');
        if (response.status === 400) {
          const data = await response.json().catch(() => ({ message: 'Ugyldig forespørsel.' }));
          throw new Error(data.message || 'Ugyldig forespørsel.');
        }
        if (!response.ok) throw new Error(`Kunne ikke opprette issue (${response.status}).`);

        const data = await response.json();
        context.addSystemMessage(`Issue opprettet: [${args}](${data.url})`);
      } catch (e) {
        context.setError(e instanceof Error ? e.message : 'Kunne ikke opprette issue.');
      }
    }
  });
}
