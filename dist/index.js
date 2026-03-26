#!/usr/bin/env node
import dotenv from "dotenv";
import OpenAI from "openai";
import * as readline from "readline";
import { execSync } from "node:child_process";
import { Read, Ls, Write, Grep, Edit } from "./tools.js";
import { toolDefination } from "./def.js";
// ─── Configuration ──────────────────────────────────────────────────
dotenv.config({ path: ".env.local" });
const MODEL = process.env.MODEL || "anthropic/claude-opus-4.6";
const MAX_CONTEXT_MESSAGES = parseInt(process.env.MAX_CONTEXT_MESSAGES || "100", 10);
const BASH_TIMEOUT = parseInt(process.env.BASH_TIMEOUT || "30000", 10);
const DANGEROUS_PATTERNS = [
    /\brm\s+(-[a-zA-Z]*)?.*(-r|-f|--recursive|--force)/,
    /\bmkfs\b/,
    /\bdd\b/,
    /\b>\s*\/dev\/sd/,
    /\bchmod\s+-R\b.*\//,
    /\bchown\s+-R\b.*\//,
    /\bkill\s+-9\b/,
    /\bshutdown\b/,
    /\breboot\b/,
    /\bcurl\b.*\|\s*(ba)?sh/,
    /\bwget\b.*\|\s*(ba)?sh/,
];
// ─── Readline / Colors ─────────────────────────────────────────────
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});
const colors = {
    assistant: "\x1b[37m",
    tool: "\x1b[33m",
    error: "\x1b[31m",
    info: "\x1b[90m",
    success: "\x1b[32m",
    prompt: "\x1b[36m",
    reset: "\x1b[0m",
};
// ─── OpenAI client ──────────────────────────────────────────────────
if (!process.env.OPENROUTER_API_KEY) {
    console.error(`${colors.error}Error: OPENROUTER_API_KEY is not set. Create a .env.local file with your key.${colors.reset}`);
    process.exit(1);
}
const openai = new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey: process.env.OPENROUTER_API_KEY,
});
// ─── Token usage tracking ───────────────────────────────────────────
let totalTokensUsed = { prompt: 0, completion: 0, total: 0 };
// ─── Helpers ────────────────────────────────────────────────────────
function ask(prompt) {
    return new Promise((resolve) => {
        rl.question(prompt, (answer) => {
            resolve(answer);
        });
    });
}
function isDangerous(command) {
    return DANGEROUS_PATTERNS.some((pattern) => pattern.test(command));
}
async function confirmDangerous(command) {
    const answer = await ask(`${colors.error}⚠ Dangerous command detected: ${command}\nDo you want to proceed? (y/N): ${colors.reset}`);
    return answer.trim().toLowerCase() === "y";
}
function trimMessages(messages) {
    while (messages.length > MAX_CONTEXT_MESSAGES + 1) {
        let removeEnd = 1;
        for (let i = 1; i < messages.length; i++) {
            removeEnd = i + 1;
            const msg = messages[i];
            if (msg.role === 'assistant' && !msg.tool_calls) {
                break;
            }
        }
        messages.splice(1, removeEnd - 1);
    }
}
function printUsageStats() {
    console.log(`${colors.info}[tokens] prompt: ${totalTokensUsed.prompt} | completion: ${totalTokensUsed.completion} | total: ${totalTokensUsed.total}${colors.reset}`);
}
// ─── Tool handlers ──────────────────────────────────────────────────
const toolHandlers = {
    bash: async (args) => {
        const cmd = args.command;
        console.log(`${colors.tool}[bash] ${cmd}${colors.reset}`);
        if (isDangerous(cmd)) {
            const confirmed = await confirmDangerous(cmd);
            if (!confirmed) {
                return "Command cancelled by user.";
            }
        }
        try {
            return execSync(cmd, {
                encoding: "utf-8",
                timeout: BASH_TIMEOUT,
                cwd: process.cwd(),
            });
        }
        catch (e) {
            return `Exit code: ${e.status ?? "unknown"}\n${e.stderr || e.message}`;
        }
    },
    read_file: async (args) => {
        return await Read(args.path);
    },
    list_dir: async (args) => {
        return Ls(args.path).join("\n");
    },
    write_file: async (args) => {
        await Write(args.path, args.content);
        return `Successfully wrote to ${args.path}`;
    },
    grep: async (args) => {
        return await Grep(args.file_path, args.keyword);
    },
    edit_file: async (args) => {
        return await Edit(args.file_path, args.old_string, args.new_string);
    },
};
// ─── Build initial context ──────────────────────────────────────────
const filetree = execSync(`ls ${process.cwd()}`).toString();
const messages = [
    {
        role: "system",
        content: `You are a coding agent assistant. The file structure: ${filetree}.
    
    Workflow: 
    - First, you need to understand user's requirement.
    - Use the tool 'list_dir' to know the structure of the program
    - Use the tool 'read_file' to read related files and understand existed code
    - Thinking the resolution of user's requirement
    - Use the tool 'write_file to modify related files'
    - At last, use 'read_file' again to verify the modification
    - If you can, use the tool 'edit_file more but not 'write_file'

When making function calls using tools that accept array or object parameters ensure those are structured using JSON. For example:
{"color": "orange", "options": {"option_key_1": true}}

Answer the user's request using the relevant tool(s), if they are available. Check that all the required parameters for each tool call are provided or can reasonably be inferred from context. IF there are no relevant tools or there are missing values for required parameters, ask the user to supply these values; otherwise proceed with the tool calls. If the user provides a specific value for a parameter (for example provided in quotes), make sure to use that value EXACTLY. DO NOT make up values for or ask about optional parameters.

If you intend to call multiple tools and there are no dependencies between the calls, make all of the independent calls in the same turn, otherwise you MUST wait for previous calls to finish first to determine the dependent values (do NOT use placeholders or guess missing parameters).`,
    },
];
// ─── Slash commands ─────────────────────────────────────────────────
function handleSlashCommand(input) {
    const trimmed = input.trim();
    if (trimmed === "/clear") {
        messages.length = 1;
        console.log(`${colors.success}✓ Conversation cleared.${colors.reset}`);
        return true;
    }
    if (trimmed === "/tokens") {
        printUsageStats();
        return true;
    }
    if (trimmed === "/model") {
        console.log(`${colors.info}Current model: ${MODEL}${colors.reset}`);
        return true;
    }
    if (trimmed === "/help") {
        console.log(`${colors.info}Available commands:
  /clear   - Clear conversation history
  /tokens  - Show token usage statistics
  /model   - Show current model
  /help    - Show this help message
  /exit    - Exit the program${colors.reset}`);
        return true;
    }
    if (trimmed === "/exit" || trimmed === "/quit") {
        printUsageStats();
        console.log(`${colors.success}Goodbye!${colors.reset}`);
        process.exit(0);
    }
    return false;
}
// ─── Graceful shutdown ──────────────────────────────────────────────
process.on("SIGINT", () => {
    console.log(`\n${colors.info}Interrupted.${colors.reset}`);
    printUsageStats();
    process.exit(0);
});
// ─── Main loop ──────────────────────────────────────────────────────
console.log(`${colors.info}xp-cli coding agent (model: ${MODEL})${colors.reset}`);
console.log(`${colors.info}Type /help for available commands.${colors.reset}\n`);
while (true) {
    const prompt = await ask(`${colors.prompt}> ${colors.reset}`);
    if (!prompt.trim())
        continue;
    if (prompt.trim().startsWith("/")) {
        if (handleSlashCommand(prompt))
            continue;
    }
    messages.push({ role: "user", content: prompt });
    while (true) {
        try {
            const stream = await openai.chat.completions.create({
                model: MODEL,
                messages: messages,
                tools: toolDefination,
                stream: true,
            });
            let fullContext = "";
            let toolCallUse = [];
            let finishReason = "";
            for await (const chunk of stream) {
                const choice = chunk.choices[0];
                const delta = choice?.delta;
                if (delta?.content) {
                    process.stdout.write(delta.content);
                    fullContext += delta.content;
                }
                if (delta?.tool_calls) {
                    for (const call of delta.tool_calls) {
                        if (!toolCallUse[call.index]) {
                            toolCallUse[call.index] = {
                                type: call.type,
                                id: call.id,
                                function: { name: "", arguments: "" },
                            };
                        }
                        if (call.function?.name) {
                            toolCallUse[call.index].function.name += call.function.name;
                        }
                        if (call.function?.arguments) {
                            toolCallUse[call.index].function.arguments += call.function.arguments;
                        }
                    }
                }
                if (choice?.finish_reason) {
                    finishReason = choice.finish_reason;
                }
                if (chunk.usage) {
                    totalTokensUsed.prompt += chunk.usage.prompt_tokens ?? 0;
                    totalTokensUsed.completion += chunk.usage.completion_tokens ?? 0;
                    totalTokensUsed.total += chunk.usage.total_tokens ?? 0;
                }
            }
            if (finishReason === "tool_calls") {
                messages.push({
                    role: "assistant",
                    content: fullContext || null,
                    tool_calls: toolCallUse,
                });
                const toolResults = await Promise.all(toolCallUse
                    .filter((call) => call.type === "function")
                    .map(async (call) => {
                    try {
                        const handler = toolHandlers[call.function.name];
                        console.log(`${colors.tool}[tool] ${call.function.name}${colors.reset}`);
                        if (!handler)
                            throw new Error(`Unknown tool: ${call.function.name}`);
                        const args = JSON.parse(call.function.arguments);
                        const result = await handler(args);
                        return {
                            role: "tool",
                            tool_call_id: call.id,
                            content: result || "(empty result)",
                        };
                    }
                    catch (e) {
                        console.log(`${colors.error}[error] ${e.message}${colors.reset}`);
                        return {
                            role: "tool",
                            tool_call_id: call.id,
                            content: `Error: ${e.message}`,
                        };
                    }
                }));
                messages.push(...toolResults);
                // Trim context if too long
                trimMessages(messages);
            }
            else if (finishReason === "stop") {
                process.stdout.write("\n");
                messages.push({ role: "assistant", content: fullContext });
                trimMessages(messages);
                break;
            }
            else {
                // Unexpected finish reason (e.g. "length" — context too long)
                console.log(`\n${colors.error}[warn] Unexpected finish reason: ${finishReason}${colors.reset}`);
                if (fullContext) {
                    messages.push({ role: "assistant", content: fullContext });
                }
                break;
            }
        }
        catch (e) {
            console.error(`${colors.error}[API Error] ${e.message}${colors.reset}`);
            // Remove the last user message so user can retry
            if (messages[messages.length - 1]?.role === "user") {
                messages.pop();
            }
            break;
        }
    }
}
//# sourceMappingURL=index.js.map