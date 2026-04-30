# Continue Setup for Phulpur24

This folder configures Continue for repository-specific AI agents.

## Authentication

The Continue CLI is `cn`. Official docs say to authenticate with:

```bash
cn login
```

If browser/device login is blocked on this machine, create a Continue API key in Continue settings and set it locally:

```bash
CONTINUE_API_KEY=your-key-here npx -y @continuedev/cli@latest -p "Review this repo"
```

Do not commit API keys. Store local secrets in `.continue/.env` or `~/.continue/.env`.

## Model Setup

`config.yaml` references strong Continue Hub model addons for agent work:

- `anthropic/claude-sonnet-4-6`
- `openai/gpt-4`
- local Ollama autocomplete fallback: `qwen2.5-coder:7b`

Continue Hub model addons require a logged-in Continue account and provider secrets configured in Continue Mission Control or local `.env` files.

## Usage

From this repository:

```bash
npx -y @continuedev/cli@latest --config .continue/config.yaml
```

In the IDE extension, reload the window after changing config files so Continue picks them up.
