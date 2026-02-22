export interface ToolContext {
  addSystemMessage(content: string): void;
  setError(msg: string): void;
}

export interface ToolHandler {
  name: string;
  description: string;
  usage: string;
  minArgs: number;
  execute(args: string, context: ToolContext): Promise<void>;
}

const registry = new Map<string, ToolHandler>();

export function registerTool(handler: ToolHandler): void {
  registry.set(handler.name, handler);
}

export function getRegisteredTools(): ToolHandler[] {
  return Array.from(registry.values());
}

/**
 * Returns true if input started with '/' (consumed by framework).
 * Returns false if input is not a slash command (caller sends to AI).
 */
export async function dispatch(rawInput: string, context: ToolContext): Promise<boolean> {
  if (!rawInput.startsWith('/')) {
    return false;
  }

  const withoutSlash = rawInput.slice(1);
  const spaceIndex = withoutSlash.indexOf(' ');
  const commandName = spaceIndex === -1 ? withoutSlash : withoutSlash.slice(0, spaceIndex);
  const args = spaceIndex === -1 ? '' : withoutSlash.slice(spaceIndex + 1).trim();

  const handler = registry.get(commandName);
  if (!handler) {
    context.setError(`Ukjent kommando: /${commandName}. Tilgjengelige kommandoer: ${Array.from(registry.keys()).map(k => `/${k}`).join(', ')}`);
    return true;
  }

  if (handler.minArgs > 0 && !args) {
    context.setError(`Bruk: /${handler.name} ${handler.usage}`);
    return true;
  }

  await handler.execute(args, context);
  return true;
}
