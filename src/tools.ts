import { readdirSync } from "fs";
import { writeFile } from "fs/promises";
import { readFile } from "fs/promises";

export async function Read(filePath: string) {
  return await readFile(`${filePath}`, { encoding: 'utf-8'});
}

export function Ls(dirPath: string) {
  const dir = dirPath || process.cwd()
  return readdirSync(dir)
}

export async function Write(filePath: string, content: string) {
  await writeFile(filePath, content, { encoding: 'utf-8' })
}

export async function Grep(filePath: string, keyword: string) {
  const content = await Read(filePath);
  const lines = content.split('\n');
  const matchedLines = lines.filter(line => line.includes(keyword));
  return matchedLines.join('\n');
}

export async function Edit(filePath: string, oldStr: string, newStr: string) {
  const content = await Read(filePath)
  if (!content.includes(oldStr)) {
    return "Error to find string in the file"
  } else {
    const newContent = content.replace(oldStr, newStr)
    await Write(filePath, newContent)
    return "OK"
  }
}