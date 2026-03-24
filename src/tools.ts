import { readdirSync } from "fs";
import { readFile } from "fs/promises";

export async function Read(file_path: string) {
  return await readFile(`${file_path}`, { encoding: 'utf-8'});
}

export function Ls(dir_path: string) {
  const dir = dir_path || process.cwd()
  return readdirSync(dir)
}

export async function write_file(file_path: string, content: string) {

}