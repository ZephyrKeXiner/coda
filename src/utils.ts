import OpenAI from "openai";

export const DANGEROUS_PATTERNS = [
  /\brm\s+(-[a-zA-Z]*)?.*(-r|-f|--recursive|--force)/,
  /\bmkfs\b/,
  /\bdd\b/,
  />\s*\/dev\/sd/,
  /\bchmod\s+-R\b.*\//,
  /\bchown\s+-R\b.*\//,
  /\bkill\s+-9\b/,
  /\bshutdown\b/,
  /\breboot\b/,
  /\bcurl\b.*\|\s*(ba)?sh/,
  /\bwget\b.*\|\s*(ba)?sh/,
];

export function isDangerous(command: string): boolean {
  return DANGEROUS_PATTERNS.some((pattern) => pattern.test(command));
}

export function estimateTokens(message: OpenAI.Chat.Completions.ChatCompletionMessageParam): number {
  let text = "";
  if (typeof message.content === "string") {
    text = message.content;
  } else if (message.content === null || message.content === undefined) {
    text = "";
  }
  const msg = message as any;
  if (msg.tool_calls) {
    text += JSON.stringify(msg.tool_calls);
  }
  return Math.ceil(Buffer.byteLength(text, "utf-8") / 3);
}

export function trimMessages(
  messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[],
  lastPromptTokens: number,
  maxContextTokens: number
): void {
  if (lastPromptTokens < maxContextTokens * 0.8) return;

  const targetTokens = maxContextTokens * 0.6;
  let currentTokens = lastPromptTokens;

  while (currentTokens > targetTokens && messages.length > 2) {
    let removeEnd = 1;
    for (let i = 1; i < messages.length; i++) {
      removeEnd = i + 1;
      const msg = messages[i] as any;
      if (msg.role === "assistant" && !msg.tool_calls) {
        break;
      }
    }

    let removedTokens = 0;
    for (let i = 1; i < removeEnd; i++) {
      removedTokens += estimateTokens(messages[i]);
    }

    messages.splice(1, removeEnd - 1);
    currentTokens -= removedTokens;
  }
}
