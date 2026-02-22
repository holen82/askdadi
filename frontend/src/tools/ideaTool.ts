import { registerTool, type ToolContext } from './toolRegistry';
import { ideaService } from '@/services/ideaService';

const MAX_IDEA_CHARS = 500;

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('nb-NO', { day: '2-digit', month: '2-digit', year: 'numeric' });
  } catch {
    return iso;
  }
}

export function registerIdeaTools(): void {
  registerTool({
    name: 'idea',
    description: 'Send inn en idé eller slett en idé',
    usage: '<tekst>  eller  delete <nummer>',
    minArgs: 1,
    async execute(args: string, context: ToolContext): Promise<void> {
      if (args.startsWith('delete ')) {
        const nStr = args.slice('delete '.length).trim();
        const n = parseInt(nStr, 10);
        if (!nStr || isNaN(n) || n < 1) {
          context.setError('Bruk: /idea delete <nummer>  (nummeret fra /ideas-listen)');
          return;
        }

        let ideas;
        try {
          ideas = await ideaService.listIdeas();
        } catch (e) {
          context.setError(e instanceof Error ? e.message : 'Kunne ikke hente ideer.');
          return;
        }

        if (n > ideas.length) {
          context.setError(`Ugyldig nummer: ${n}. Det finnes ${ideas.length} idé(er).`);
          return;
        }

        const record = ideas[n - 1];
        try {
          await ideaService.deleteIdea(record.id);
          context.addSystemMessage(`Idé #${n} ble slettet.`);
        } catch (e) {
          context.setError(e instanceof Error ? e.message : 'Kunne ikke slette idéen.');
        }
        return;
      }

      if (args.length > MAX_IDEA_CHARS) {
        context.setError(`Idéen er for lang. Maks ${MAX_IDEA_CHARS} tegn tillatt.`);
        return;
      }

      try {
        await ideaService.submitIdea(args);
        const preview = args.length > 60 ? args.slice(0, 60) + '…' : args;
        context.addSystemMessage(`Ideen din ble lagret: "${preview}"`);
      } catch (e) {
        context.setError(e instanceof Error ? e.message : 'Kunne ikke lagre idéen.');
      }
    }
  });

  registerTool({
    name: 'ideas',
    description: 'Vis alle innsendte ideer',
    usage: '',
    minArgs: 0,
    async execute(_args: string, context: ToolContext): Promise<void> {
      let ideas;
      try {
        ideas = await ideaService.listIdeas();
      } catch (e) {
        context.setError(e instanceof Error ? e.message : 'Kunne ikke hente ideer.');
        return;
      }

      if (ideas.length === 0) {
        context.addSystemMessage('Ingen ideer er lagret ennå.');
        return;
      }

      const lines = [`**Innsendte ideer (${ideas.length}):**`];
      ideas.forEach((idea, i) => {
        lines.push(`${i + 1}. ${idea.text} *(${idea.author}, ${formatDate(idea.timestamp)})*`);
      });
      lines.push('');

      context.addSystemMessage(lines.join('\n'));
    }
  });
}
