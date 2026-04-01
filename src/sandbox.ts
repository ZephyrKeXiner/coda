import dotenv from "dotenv";
import { Sandbox } from "e2b";

dotenv.config({ path: ".env.local" });

export async function create_sandbox(name: string) {
  const sandbox = await Sandbox.create();
  return sandbox;
}

export async function command_run(sandbox: Sandbox, command: string) {
  const result = await sandbox.commands.run(command);
  return result;
}
