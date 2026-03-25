#!/usr/bin/env node
import dotenv from "dotenv";
import OpenAI from 'openai';
import * as readline from "readline";
import { execSync } from "node:child_process";
import { Read, Ls, Write, Grep, Edit } from "../src/tools.js"
import { toolDefination } from "./def.js";
import { argon2Sync } from "node:crypto";
import { unwatchFile } from "node:fs";
import { callbackify } from "node:util";

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

const toolHandlers: Record<string, (args: Record<string, any>) => Promise<string>> = {
  bash: async (args) => {
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
  edit_file: async (args) => {
    return await Edit(args.file_path, args.old_string, args.new_string)
  }
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
    - At last, use 'read_file' again to verify the modification
    - If you can, use the tool 'edit_file more but not 'write_file'`
  }
]

while(true) {
  const prompt = await ask('> ')
  message.push({ role: 'user', content: prompt})

  while (true) {
    const stream = await openai.chat.completions.create({
      model: "qwen/qwen3-235b-a22b-2507",//"anthropic/claude-opus-4.6",//'qwen/qwen3-235b-a22b-2507'
      messages: message,
      tools: toolDefination,
      ...{ extra_body: { thinking: { type: 'enabled', budget_tokens: 4096 } } },
      stream: true
    })

    let fullContext = ''
    let toolCallUse: any[] = []
    let finishReason = ''

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta
      if (delta?.content) {
        process.stdout.write(delta.content)
        fullContext += delta.content
      }

      if (delta?.tool_calls) {
        for (const call of delta.tool_calls) {
          if (!toolCallUse[call.index]) {
            toolCallUse[call.index] = {
              type: call.type,
              id: call.id,
              function: { name: '', arguments: '' }
            }
          }

          if (call.function?.name) {
            toolCallUse[call.index].function.name += call.function.name
          }
          if (call.function?.arguments) {
            toolCallUse[call.index].function.arguments += call.function.arguments
          }
        }
      }

      if (chunk.choices[0].finish_reason) {
        finishReason = chunk.choices[0].finish_reason
      }
    }

    if (finishReason === 'tool_calls') {
      message.push({
        role: 'assistant',
        content: fullContext || null,
        tool_calls: toolCallUse
      } as any)
      
      for (const call of toolCallUse) {
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
    } else if (finishReason === 'stop') {
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