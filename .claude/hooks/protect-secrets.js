#!/usr/bin/env node
/**
 * PreToolUse hook — blocks Write/Edit on real secret files.
 *
 * ShopHive rule (CLAUDE.md / .claude/rules/security.md): never commit or hand-edit
 * a real `.env`. Secrets are read through ConfigService; only `.env.example` is tracked.
 * This hook is defense-in-depth so an agent cannot accidentally write a secret file.
 *
 * Wired in .claude/settings.json under hooks.PreToolUse (matcher: Write|Edit).
 * Reads the hook payload as JSON on stdin; denies by printing a PreToolUse decision.
 */
'use strict';

let raw = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', (chunk) => (raw += chunk));
process.stdin.on('end', () => {
  let filePath = '';
  try {
    const payload = JSON.parse(raw || '{}');
    filePath = (payload.tool_input && payload.tool_input.file_path) || '';
  } catch {
    // Malformed payload — fail open (allow); not this hook's job to police that.
    process.exit(0);
  }

  const normalized = filePath.replace(/\\/g, '/').toLowerCase();
  const base = normalized.split('/').pop() || '';

  // Allow the committed template and any *.env.example variants.
  const isExample = base.endsWith('.example') || base.endsWith('.sample');
  // Match `.env`, `.env.local`, `.env.production`, `backend.env`, etc.
  const isEnvFile = /(^|\.)\.?env(\.[^/]*)?$/.test(base) || base === '.env';

  if (isEnvFile && !isExample) {
    const out = {
      hookSpecificOutput: {
        hookEventName: 'PreToolUse',
        permissionDecision: 'deny',
        permissionDecisionReason:
          `Blocked: "${filePath}" looks like a real secret/env file. ` +
          `Per .claude/rules/security.md, secrets are never hand-edited or committed — ` +
          `edit ".env.example" instead and read values via ConfigService.`,
      },
    };
    process.stdout.write(JSON.stringify(out));
  }
  process.exit(0);
});
