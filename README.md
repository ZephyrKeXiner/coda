# xp-cli — AI Coding Agent

A CLI-based AI coding agent powered by [OpenRouter](https://openrouter.ai/). It gives an LLM (default: Claude) the ability to read, write, edit, search files, and execute bash commands in your local project — like a mini Cursor/Claude Code in your terminal.

## Features

- 🤖 **AI-powered coding assistant** — chat with an LLM that can modify your codebase
- 📁 **File tools** — read, write, edit, grep, list directories
- 🖥️ **Bash execution** — run shell commands with safety guards
- 🔒 **Security** — path traversal protection, dangerous command confirmation
- 🎨 **Streaming output** — real-time streamed responses
- 💬 **Slash commands** — `/clear`, `/tokens`, `/model`, `/help`, `/exit`
- 📊 **Token tracking** — monitor API usage

## Installation

```bash
# Clone the repo
git clone <your-repo-url>
cd x402-agent

# Install dependencies
npm install

# Set up environment
cp .env.example .env.local
# Edit .env.local and add your OpenRouter API key

# Build
npm run build
```

## Usage

### Development mode
```bash
npm run dev:client
```

### Production mode
```bash
npm run build
npm start
```

### As a global CLI
```bash
npm link
xp-cli
```

## Slash Commands

| Command   | Description                    |
|-----------|--------------------------------|
| `/clear`  | Clear conversation history     |
| `/tokens` | Show token usage statistics    |
| `/model`  | Show current model             |
| `/help`   | Show available commands        |
| `/exit`   | Exit the program               |

## Configuration

All configuration is done via environment variables in `.env.local`:

| Variable               | Default                       | Description                       |
|------------------------|-------------------------------|-----------------------------------|
| `OPENROUTER_API_KEY`   | *(required)*                  | Your OpenRouter API key           |
| `MODEL`                | `anthropic/claude-opus-4.6`   | LLM model to use                  |
| `MAX_CONTEXT_MESSAGES` | `100`                         | Max messages kept in context      |
| `BASH_TIMEOUT`         | `30000`                       | Bash command timeout (ms)         |

## Available Tools

The agent has access to the following tools:

- **`read_file`** — Read file contents
- **`write_file`** — Write content to a file (creates parent dirs automatically)
- **`edit_file`** — Find and replace a unique string in a file
- **`list_dir`** — List directory contents
- **`grep`** — Search for a keyword in a file (with line numbers)
- **`bash`** — Execute a shell command (with dangerous command protection)

## License

ISC
