import { ChildProcess, spawn } from "child_process";
import { Interface, createInterface } from "readline";

export class McpClient {
  private process: ChildProcess;
  private rl: Interface;
  private nextId = 1;
  private pending = new Map<number, (result: any) => void>();

  constructor(command: string, args: string[]) {
    this.process = spawn(command, args, {
      stdio: ["pipe", "pipe", "pipe"],
    });

    this.rl = createInterface({ input: this.process.stdout! });
    this.rl.on("line", (line) => {
      const msg = JSON.parse(line);
      const resolve = this.pending.get(msg.id);
      if (resolve) {
        resolve(msg.result);
        this.pending.delete(msg.id);
      }
    });
  }

  request(method: string, params?: any): Promise<any> {
    const id = this.nextId++;
    return new Promise((resolve) => {
      this.pending.set(id, resolve);
      const msg = JSON.stringify({ jsonrpc: "2.0", id, method, params }) + "\n";
      this.process.stdin!.write(msg);
    });
  }

  async connect(): Promise<void> {
    await this.request("initialize", {
      protocolVersion: "2024-11-05",
      capabilities: {},
      clientInfo: { name: "coda", version: "1.0.0" },
    });
    this.process.stdin!.write(
      JSON.stringify({ jsonrpc: "2.0", method: "notifications/initialized" }) +
      "\n",
    );
  }

  async listTools(): Promise<any[]> {
    const result = await this.request("tools/list", {});
    return result.tools;
  }

  async callTool(name: string, args: Record<string, any>): Promise<any> {
    return await this.request("tools/call", { name, arguments: args });
  }
}
