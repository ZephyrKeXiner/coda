import { readdirSync } from "fs";
import { writeFile } from "fs/promises";
import { readFile } from "fs/promises";

export async function Read(file_path: string) {
  return await readFile(`${file_path}`, { encoding: 'utf-8'});
}

export function Ls(dir_path: string) {
  const dir = dir_path || process.cwd()
  return readdirSync(dir)
}

export async function Write(file_path: string, content: string) {
  await writeFile(file_path, content, { encoding: 'utf-8' })
}

export async function Grep(file_path: string, keyword: string) {
  const content = await Read(file_path);
  const lines = content.split('\n');
  const matchedLines = lines.filter(line => line.includes(keyword));
  return matchedLines.join('\n');
}