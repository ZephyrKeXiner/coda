#!/usr/bin/env node
import dotenv from "dotenv";
import OpenAI from 'openai';
import * as readline from "readline";
import { readFile } from "node:fs/promises";
import { execSync } from "node:child_process";
import { Tracing } from "node:trace_events";


const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

dotenv.config({ path: ".env.local"})

const openai = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY,
})

const toolDefination: OpenAI.Chat.Completions.ChatCompletionTool[] = [
  {
    "type": "function",
    "function": {
      "name": "read_file",
      "description": "Read local file content",
      "parameters": {
        "type": "object",
        "properties": {
          "path": {
            type: "string",
            description: "The file path when you need to read"
          },
        },
        required: ["path"]
      }
    }
  }
]

const filetree = execSync(`ls ${process.cwd()}`).toString()

const message: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
  {
    role: 'system',
    content: `You are a coding agent assistance. The file structure: ${filetree}`
  }
]

while(true) {
  const prompt = await ask('> ')
  message.push({ role: 'user', content: prompt})

  while (true) {
    const completion = await openai.chat.completions.create({
      model: 'qwen/qwen3-235b-a22b-2507',
      messages: message,
      tools: toolDefination
    })

    console.log(completion.choices[0].message.content)

    if (completion.choices[0].finish_reason === 'tool_calls') {
      console.log(JSON.stringify(completion.choices[0].message.tool_calls))
      for (const call of completion.choices[0].message.tool_calls!) {
        if (call.type != "function") continue
        if (call.function.name == 'bash') {
          const fn = (call as any).function
          const args = JSON.parse(fn.arguments)
          const command = args.command
        } else if (call.function.name == 'read_file'){
          const args = JSON.parse(call.function.arguments)
          const content = await read_file(args.path)
          message.push({
            role: 'tool',
            tool_call_id: call.id,
            content: content
          })
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

async function read_file(file_path: string) {
  console.log(file_path)
  const data = await readFile(`${file_path}`, { encoding: 'utf-8'});
  console.log(data)
  return data
}

async function write_file(file_path: string, content: string) {
  
}