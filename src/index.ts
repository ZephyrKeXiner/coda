#!/usr/bin/env node
import dotenv from "dotenv";
import OpenAI from 'openai';
import * as readline from "readline";
import { execSync } from "node:child_process";
import { Read, Ls } from "../src/tools.js"

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
    type: "function",
    function: {
      name: "read_file",
      description: "Read local file content",
      parameters: {
        type: "object",
        properties: {
          path: {
            type: "string",
            description: "The file path when you need to read"
          },
        },
        required: [ "path" ]
      }
    }
  },
  {
    type: "function",
    function: {
      name: "list_dir",
      description: "List the directory's content",
      parameters: {
        type: "object",
        properties: {
          path: {
            type: "string",
            description: "The directory path that you want to know the file in it"
          },
        },
        required: [ "path" ]
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
      model: "moonshotai/kimi-k2.5",//"anthropic/claude-opus-4.6",//'qwen/qwen3-235b-a22b-2507'
      messages: message,
      tools: toolDefination
    })

    console.log(completion.choices[0].message.content)

    if (completion.choices[0].finish_reason === 'tool_calls') {
      console.log(JSON.stringify(completion.choices[0].message.tool_calls))
      message.push(completion.choices[0].message)
      for (const call of completion.choices[0].message.tool_calls!) {
        if (call.type != "function") continue
        if (call.function.name == 'bash') {
          const fn = (call as any).function
          const args = JSON.parse(fn.arguments)
          const command = args.command
        } else if (call.function.name == 'read_file'){
          const args = JSON.parse(call.function.arguments)
          const fileContent = await Read(args.path)
          message.push({
            role: 'tool',
            tool_call_id: call.id,
            content: fileContent
          })
        } else if (call.function.name == 'list_dir') {
          const args = JSON.parse(call.function.arguments)
          const dirContent = Ls(args.path).join(`\n`)
          message.push({
            role: 'tool',
            tool_call_id: call.id,
            content: dirContent
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