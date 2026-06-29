# Hooks

Deterministic guardrails the harness runs around tool calls. Hooks execute as commands (not model reasoning), so they enforce rules that must never be skipped.

| Hook | Event | Purpose |
|---|---|---|
| `protect-secrets.js` | `PreToolUse` (Write\|Edit) | Denies edits to real `.env` files; allows `.env.example`. Enforces the secrets rule in `.claude/rules/security.md`. |

Wired in `.claude/settings.json` under `hooks`. They run with the project's Node (this is a Node monorepo, so `node` is always available — keeping hooks in JS makes them cross-platform on Windows/macOS/Linux).

## Adding a hook
1. Write the script here. Read the JSON payload from stdin; for `PreToolUse`, deny by printing a `hookSpecificOutput` object with `permissionDecision: "deny"`.
2. Register it in `settings.json` `hooks.<Event>` with a `matcher` (tool name regex) and the `command` (`node .claude/hooks/<file>.js`).
3. Keep hooks fast and fail-open on malformed input — a hook that blocks legitimate work is worse than the gap it closes.

## Candidate hooks (not yet enabled)
- `PostToolUse` on `Edit|Write` for `*.ts` → run Prettier/ESLint on the touched file.
- `Stop` → remind to run `feature-handoff` before committing.

Enable these only if the team wants them; they add latency to every matching tool call.
