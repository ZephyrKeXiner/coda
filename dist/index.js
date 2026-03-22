#!/usr/bin/env node
import { wrapAxiosWithPayment, x402Client } from "@x402/axios";
import { ExactEvmScheme, toClientEvmSigner } from "@x402/evm";
import { privateKeyToAccount } from "viem/accounts";
import { createPublicClient, http } from "viem";
import { baseSepolia } from "viem/chains";
import 'dotenv/config';
import axios from 'axios';
import { Command } from 'commander';
import { writeSync } from 'node:fs';
const program = new Command();
program
    .version("1.0.0")
    .description("x402 Agent Skills Payment CLI")
    .option('-p, --prompt <value>', 'Your prompt passed to needed agent skill');
program.parse(process.argv);
const options = program.opts();
const account = privateKeyToAccount(process.env.EVM_PRIVATE_KEY);
const publicClient = createPublicClient({ chain: baseSepolia, transport: http() });
const signer = toClientEvmSigner(account, publicClient);
const client = new x402Client();
client.register("eip155:*", new ExactEvmScheme(signer));
const api = wrapAxiosWithPayment(axios.create({ baseURL: "http://localhost:4021", timeout: 300000 }), client);
const str = options.prompt;
writeSync(1, "正在发送支付请求...\n");
try {
    const response = await api.post("/skill", { str });
    writeSync(1, `Response: ${response.data.stdout}\n`);
}
catch (e) {
    writeSync(2, `Error: ${JSON.stringify(e.response?.data || e.message)}\n`);
    process.exitCode = 1;
}
//# sourceMappingURL=index.js.map