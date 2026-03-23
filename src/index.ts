#!/usr/bin/env node

import { wrapAxiosWithPayment, x402Client } from "@x402/axios";
import { ExactEvmScheme, toClientEvmSigner } from "@x402/evm";
import { privateKeyToAccount } from "viem/accounts";
import { createPublicClient, http } from "viem";
import { baseSepolia } from "viem/chains";
import dotenv from "dotenv";
import axios from 'axios'
import { Command, Option } from 'commander';
import { open, writeSync } from 'node:fs';
import OpenAI from 'openai';
import { Sandbox } from 'e2b';
import * as readline from "readline";
import { resolve } from "node:dns";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

dotenv.config({ path: ".env.local"})

const openai = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY,
})

const toolDefination: OpenAI.Chat.Completions.ChatCompletionTool[] = [{
  "type": "function",
  "function": {
    "name": "bash",
    "description": "Run a bash command in a Linux terminal",
    "parameters": {
      "type": "object",
      "properties": {
        "command": {
          type: "string",
          description: "Run a bash command"
        },
      },
      required: ["command"]
    }
  }
}]

const sandbox = await Sandbox.create({ timeoutMs: 5 * 60 * 1000 })

while(true) {
  const prompt = await ask('> ')

  const message: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [{
    "role": 'user',
    "content": prompt,//'用 curl 获取 https://httpbin.org/ip 的返回内容，然后用 echo 把 IP 地址单独打印出来',
  }]

  while (true) {
    const completion = await openai.chat.completions.create({
      model: 'qwen/qwen3-235b-a22b-2507',
      messages: message,
      tools: toolDefination
    })

    console.log(completion)
    console.log(completion.choices[0].message.content)

    if (completion.choices[0].finish_reason === 'tool_calls') {
      console.log(JSON.stringify(completion.choices[0].message.tool_calls))
      message.push({ role: 'assistant', content: completion.choices[0].message.content})
      for (const call of completion.choices[0].message.tool_calls!) {
        if (call.type != "function") continue

        const fn = (call as any).function
        const args = JSON.parse(fn.arguments)
        const command = args.command
        const result = await sandbox.commands.run(command)

        console.log(result.stdout || result.stderr || 'no output')
        message.push({
          role: 'tool',
          tool_call_id: call.id,
          content: result.stdout || result.stderr || 'no output'
        })
      }
    } else if (completion.choices[0].finish_reason === 'stop') {
      sandbox.kill()
      break
    }
  }
}
function ask(prompt: string): Promise<string> {
  return new Promise(resolve => {
    rl.question(prompt, (answer) => {
      resolve(answer)
    })
  })
}
// const account = privateKeyToAccount(process.env.EVM_PRIVATE_KEY as `0x{string}`)
// const publicClient = createPublicClient({ chain: baseSepolia, transport: http()})
// const signer = toClientEvmSigner(account, publicClient)

// const client = new x402Client()
// client.register("eip155:*", new ExactEvmScheme(signer))

// const api = wrapAxiosWithPayment(
//   axios.create({ baseURL: "https://localhost:4021"}),
//   client
// )

// const response = await api.post("/sandbox", )


// const program = new Command()

// program
//  .version("1.0.0")
//  .description("x402 Agent Skills Payment CLI")
//  .option('-p, --prompt <value>', 'Your prompt passed to needed agent skill')

// program.parse(process.argv)

// const options = program.opts()

// const account = privateKeyToAccount(process.env.EVM_PRIVATE_KEY as `0x${string}`);
// const publicClient = createPublicClient({ chain: baseSepolia, transport: http() });
// const signer = toClientEvmSigner(account, publicClient);

// const client = new x402Client();
// client.register("eip155:*", new ExactEvmScheme(signer))

// const api = wrapAxiosWithPayment(
//   axios.create({ baseURL: "http://localhost:4021", timeout: 300000 }),
//   client
// )

// const str = options.prompt
// writeSync(1, "正在发送支付请求...\n")
// try {
//   const response = await api.post("/skill", { str });
//   writeSync(1, `Response: ${response.data.stdout}\n`);
// } catch (e: any) {
//   writeSync(2, `Error: ${JSON.stringify(e.response?.data || e.message)}\n`);
//   process.exitCode = 1;
// }