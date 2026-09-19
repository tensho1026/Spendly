<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Local model policy

- Do not invoke Ollama, LM Studio, or any other local model/runtime, including via CLI commands, local HTTP APIs, scripts, subprocesses, or tools.
- Do not start, probe, list, or use local model services such as `ollama`, `ollama run`, `ollama list`, or `http://127.0.0.1:11434`.
- Use the configured OpenAI Codex model for all reasoning and content generation. Only use a local model if the user explicitly requests it in the current task.
