import { readdirSync, existsSync, statSync } from "fs";
import { writeFile, readFile, mkdir } from "fs/promises";
import path from "path";
import { performance } from "perf_hooks";

/**
 * Resolve and validate a file path, ensuring it stays within the project root.
 * Prevents path traversal attacks.
 */
function safePath(filePath: string): string {
  const start = performance.now();
  try {
    const resolved = path.resolve(process.cwd(), filePath);
    if (!resolved.startsWith(process.cwd())) {
      throw new Error(`Access denied: path "${filePath}" is outside the project directory.`);
    }
    return resolved;
  } finally {
    const duration = (performance.now() - start).toFixed(2);
    console.log(`[safePath] executed in ${duration}ms`);
  }
}

export async function Read(filePath: string): Promise<string> {
  const start = performance.now();
  try {
    const resolved = safePath(filePath);
    if (!existsSync(resolved)) {
      throw new Error(`File not found: ${filePath}`);
    }
    if (statSync(resolved).isDirectory()) {
      throw new Error(`"${filePath}" is a directory, not a file. Use list_dir instead.`);
    }
    return await readFile(resolved, { encoding: "utf-8" });
  } finally {
    const duration = (performance.now() - start).toFixed(2);
    console.log(`[Read] "${filePath}" executed in ${duration}ms`);
  }
}

export function Ls(dirPath: string): string[] {
  const start = performance.now();
  try {
    const dir = dirPath || process.cwd();
    const resolved = safePath(dir);
    if (!existsSync(resolved)) {
      throw new Error(`Directory not found: ${dir}`);
    }
    if (!statSync(resolved).isDirectory()) {
      throw new Error(`"${dir}" is not a directory.`);
    }
    return readdirSync(resolved);
  } finally {
    const duration = (performance.now() - start).toFixed(2);
    console.log(`[Ls] "${dirPath}" executed in ${duration}ms`);
  }
}

export async function Write(filePath: string, content: string): Promise<void> {
  const start = performance.now();
  try {
    const resolved = safePath(filePath);
    // Ensure parent directory exists
    const parentDir = path.dirname(resolved);
    if (!existsSync(parentDir)) {
      await mkdir(parentDir, { recursive: true });
    }
    await writeFile(resolved, content, { encoding: "utf-8" });
  } finally {
    const duration = (performance.now() - start).toFixed(2);
    console.log(`[Write] "${filePath}" executed in ${duration}ms`);
  }
}

export async function Grep(filePath: string, keyword: string): Promise<string> {
  const start = performance.now();
  try {
    const content = await Read(filePath);
    const lines = content.split("\n");
    const matchedLines = lines
      .map((line, i) => ({ line, lineNum: i + 1 }))
      .filter(({ line }) => line.includes(keyword))
      .map(({ line, lineNum }) => `${lineNum}: ${line}`);
    if (matchedLines.length === 0) {
      return `No matches found for "${keyword}" in ${filePath}`;
    }
    return matchedLines.join("\n");
  } finally {
    const duration = (performance.now() - start).toFixed(2);
    console.log(`[Grep] "${keyword}" in "${filePath}" executed in ${duration}ms`);
  }
}

export async function Edit(filePath: string, oldStr: string, newStr: string): Promise<string> {
  const start = performance.now();
  try {
    const content = await Read(filePath);
    if (!content.includes(oldStr)) {
      return `Error: Could not find the specified string in ${filePath}. Make sure the old_string matches exactly (including whitespace and line breaks).`;
    }
    // Check uniqueness
    const occurrences = content.split(oldStr).length - 1;
    if (occurrences > 1) {
      return `Error: The specified string appears ${occurrences} times in ${filePath}. The old_string must be unique. Please provide a more specific string.`;
    }
    const newContent = content.replace(oldStr, newStr);
    await Write(filePath, newContent);
    return "OK";
  } finally {
    const duration = (performance.now() - start).toFixed(2);
    console.log(`[Edit] "${filePath}" executed in ${duration}ms`);
  }
}