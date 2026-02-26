import { registerTool, type ToolContext } from './toolRegistry';
import { chatmodeService } from '@/services/chatmodeService';

const VALID_MODES = ['fun', 'normal'];

export function registerChatmodeTools(): void {
  registerTool({
    name: 'chatmode',
    description: 'Vis eller endre chatmodus',
    usage: '[fun|normal]',
    minArgs: 0,
    async execute(args: string, context: ToolContext): Promise<void> {
      const arg = args.trim().toLowerCase();

      if (!arg) {
        try {
          const mode = await chatmodeService.getChatMode();
          context.addSystemMessage(`Gjeldende chatmodus: **${mode}**`);
        } catch (e) {
          context.setError(e instanceof Error ? e.message : 'Kunne ikke hente chatmodus.');
        }
        return;
      }

      if (!VALID_MODES.includes(arg)) {
        context.setError(`Ugyldig modus: "${arg}". Gyldige valg er: ${VALID_MODES.join(', ')}.`);
        return;
      }

      try {
        const mode = await chatmodeService.setChatMode(arg);
        context.addSystemMessage(`Chatmodus endret til: **${mode}**`);
      } catch (e) {
        context.setError(e instanceof Error ? e.message : 'Kunne ikke endre chatmodus.');
      }
    }
  });
}
