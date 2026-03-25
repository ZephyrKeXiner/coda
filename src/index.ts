#!/usr/bin/env node
import dotenv from "dotenv";
import OpenAI from 'openai';
import * as readline from "readline";
import { execSync } from "node:child_process";
import { Read, Ls, Write, Grep } from "../src/tools.js"
import { toolDefination } from "./def.js";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

dotenv.config({ path: ".env.local"})

const openai = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY,
})

const filetree = execSync(`ls ${process.cwd()}`).toString()

// Tool handler map: each tool name maps to an async function that takes parsed args and returns a string result
const toolHandlers: Record<string, (args: Record<string, any>) => Promise<string>> = {
  bash: async (args) => {
    // bash handler: currently a no-op placeholder
    const _command = args.command;
    return '';
  },
  read_file: async (args) => {
    return await Read(args.path);
  },
  list_dir: async (args) => {
    return Ls(args.path).join('\n');
  },
  write_file: async (args) => {
    await Write(args.path, args.content);
    return '';
  },
  grep: async (args) => {
    return await Grep(args.file_path, args.keyword);
  },
};

const message: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
  {
    role: 'system',
    content: `You are a coding agent assistance. The file structure: ${filetree}.
    
    Workflow: 
    - First, you need to understand user's requirement.
    - Use the tool 'list_dir' to know the structure of the program
    - Use the tool 'read_file' to read related files and understand existed code
    - Thinking the resolution of user's requirement
    - Use the tool 'write_file to modify related files'
    - At last, use 'read_file' again to verify the modification`
  }
]

while(true) {
  const prompt = await ask('> ')
  message.push({ role: 'user', content: prompt})

  while (true) {
    const completion = await openai.chat.completions.create({
      model: "anthropic/claude-opus-4.6",//"anthropic/claude-opus-4.6",//'qwen/qwen3-235b-a22b-2507'
      messages: message,
      tools: toolDefination,
      ...{ extra_body: { thinking: { type: 'enabled', budget_tokens: 4096 } } }
    })

    console.log(completion.choices[0].message.content)

    if (completion.choices[0].finish_reason === 'tool_calls') {
      console.log(JSON.stringify(completion.choices[0].message.tool_calls))
      message.push(completion.choices[0].message)
      for (const call of completion.choices[0].message.tool_calls!) {
        if (call.type != "function") continue

        const handler = toolHandlers[call.function.name];
        if (handler) {
          const args = JSON.parse(call.function.arguments);
          const result = await handler(args);
          message.push({
            role: 'tool',
            tool_call_id: call.id,
            content: result,
          });
        } else {
          console.warn(`Unknown tool: ${call.function.name}`);
        }
      }
    } else if (completion.choices[0].finish_reason === 'stop') {
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
