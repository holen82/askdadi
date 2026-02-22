export const TOKEN_BUDGET = {
  MAX_INPUT_TOKENS: 6000,
  SYSTEM_PROMPT_OVERHEAD: 100,
  MAX_OUTPUT_TOKENS: 1000,
  get CONVERSATION_BUDGET() {
    return this.MAX_INPUT_TOKENS - this.SYSTEM_PROMPT_OVERHEAD - this.MAX_OUTPUT_TOKENS;
  }
} as const;

// ~4 chars per token (conservative estimate for English/Norwegian)
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

// Returns the tail of messages that fits within the budget, dropping oldest first
export function trimMessagesToBudget<T extends { role: string; content: string }>(
  messages: T[],
  budgetTokens: number = TOKEN_BUDGET.CONVERSATION_BUDGET
): T[] {
  let totalTokens = 0;
  let startIndex = messages.length;
  for (let i = messages.length - 1; i >= 0; i--) {
    const msgTokens = estimateTokens(messages[i].content);
    if (totalTokens + msgTokens > budgetTokens) break;
    totalTokens += msgTokens;
    startIndex = i;
  }
  return messages.slice(startIndex);
}
