# xp-cli

Terminal AI coding agent. Powered by [OpenRouter](https://openrouter.ai/), default model Claude Opus 4.6.

LLM can read, write, edit, search files, run bash commands, and spawn sub-agents in your local project.

## Quick Start

```bash
git clone <your-repo-url>
cd coda
npm install

# Configure
cp .env.example .env.local
# Add your OPENROUTER_API_KEY to .env.local

# Run
npm run dev
```

## Features

- **File tools** - read, write, edit, list, grep
- **Bash execution** - with dangerous command detection and confirmation
- **Sub-agent** - delegate subtasks to independent agent instances (max depth 3)
- **Sandbox** - E2B cloud sandbox for isolated command execution
- **Memory** - conversation history persisted to JSON, auto-saved on exit (Ctrl+C)
- **Streaming** - real-time streamed responses
- **Token management** - usage tracking and automatic context trimming
- **Security** - path traversal protection, dangerous command patterns

## Usage

```bash
# Development
npm run dev

# Production
npm run build && npm start

# Global CLI
npm link
xp-cli
```

## Commands

| Command   | Description          |
|-----------|----------------------|
| `/clear`  | Clear conversation   |
| `/tokens` | Show token usage     |
| `/model`  | Show current model   |
| `/help`   | Show help            |
| `/exit`   | Exit                 |

## Tools

| Tool         | Description                                    |
|--------------|------------------------------------------------|
| `read_file`  | Read file contents                             |
| `write_file` | Write to file (auto-creates parent dirs)       |
| `edit_file`  | Find and replace unique string in file         |
| `list_dir`   | List directory contents                        |
| `grep`       | Search keyword in file with line numbers       |
| `bash`       | Execute shell command                          |
| `subagent`   | Spawn sub-agent for independent subtasks       |

## Configuration

`.env.local`:

| Variable             | Default                     | Description             |
|----------------------|-----------------------------|-------------------------|
| `OPENROUTER_API_KEY` | *(required)*                | OpenRouter API key      |
| `MODEL`              | `anthropic/claude-opus-4.6` | LLM model               |
| `MAX_CONTEXT_TOKENS` | `100000`                    | Context window limit    |
| `BASH_TIMEOUT`       | `30000`                     | Bash timeout (ms)       |

## Project Structure

```
src/
  index.ts    - Main loop, agent core, slash commands
  tools.ts    - File operation tools (read, write, edit, grep, ls)
  def.ts      - Tool definitions for OpenAI function calling
  utils.ts    - Helpers (isDangerous, token estimation, trimMessages)
  memory.ts   - Conversation persistence and vector index (vectra)
  sandbox.ts  - E2B cloud sandbox integration
  test.ts     - Test suite
bin/
  xp-cli.sh   - CLI entry point
```

## Testing

```bash
npm test
```

## License

ISC
