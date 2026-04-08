import dotenv from "dotenv";
import { Sandbox } from "e2b";

dotenv.config({ path: ".env.local" });

let cachedSandboxId: string | null = null;

async function getOrCreateSandbox(): Promise<Sandbox> {
  if (cachedSandboxId) {
    try {
      return await Sandbox.connect(cachedSandboxId);
    } catch {
      cachedSandboxId = null;
    }
  }

  const sandbox = await Sandbox.create({
    timeoutMs: 60_000,
    lifecycle: { onTimeout: "pause", autoResume: false },
  });
  cachedSandboxId = (await sandbox.getInfo()).sandboxId;
  return sandbox;
}

export async function E2BSandbox(command: string) {
  const sandbox = await getOrCreateSandbox();
  const result = await sandbox.commands.run(command);
  return `exit_code: ${result.exitCode}\nstdout: ${result.stdout}\nstderr: ${result.stderr}`;
}

export async function killSandbox() {
  if (cachedSandboxId) {
    const sandbox = await Sandbox.connect(cachedSandboxId);
    await sandbox.kill();
    cachedSandboxId = null;
  }
}
