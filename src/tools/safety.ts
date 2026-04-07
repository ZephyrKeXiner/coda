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
