import { LocalIndex, TextSplitter } from "vectra";
import path from "node:path";
import OpenAI from "openai";
import { readFile } from "node:fs/promises";
import { existsSync, writeFileSync } from "node:fs";

const MEMORY_FILE = new URL("../memory.json", import.meta.url).pathname;

export function saveMessages(messages: any[]) {
  writeFileSync(MEMORY_FILE, JSON.stringify(messages, null, 2));
}

export async function loadMessages() {
  if (!existsSync(MEMORY_FILE)) return [];
  return JSON.parse(await readFile(MEMORY_FILE, "utf-8"));
}

export async function saveIndex(prompt: string) {
  const textSplitter = new TextSplitter({ chunkSize: 400, chunkOverlap: 50 });
  const index = new LocalIndex(path.join(process.cwd(), "my-index"));

  const chunk = textSplitter.split(prompt);

  if (!(await index.isIndexCreated())) {
    await index.createIndex({
      version: 1,
      metadata_config: { indexed: ["catagory"] },
    });
  }

  for (const textChunk of chunk) {
    await index.insertItem({
      vector: await getVector(textChunk.text),
      metadata: {
        text: textChunk.text,
      },
    });
  }
}

async function getVector(text: string): Promise<number[]> {
  const openai = new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey: process.env.OPENROUTER_API_KEY,
  });

  const resp = await openai.embeddings.create({
    model: "openai/text-embedding-3-small",
    input: text,
  });

  return resp.data[0].embedding;
}
