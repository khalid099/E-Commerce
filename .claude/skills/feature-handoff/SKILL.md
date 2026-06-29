---
name: feature-handoff
description: Run the end-of-feature quality gate for ShopHive before the human commits — build, lint, tests, doc/Build-Order updates, and a NOTES.md entry. Use when a feature is finished and ready for sign-off. Does NOT commit; the human commits.
---

# Feature handoff gate

Run this when a Build Order item is done, before the human commits. The goal: nothing half-finished slips through, and the project's progress docs stay true.

## Steps

1. **Build & types** — from repo root: `npm run build` (or `npx tsc --noEmit` per app). Must be clean. No `any`, no type errors.

2. **Lint** — `npm run lint` if defined. Fix violations; do not disable rules to pass.

3. **Tests** — `npm test`. Report the real result. If the feature touches orders/cart/auth, confirm the relevant `qa-tester` coverage exists and passes (stock atomicity, totals, ownership). Never report green without running.

4. **Non-negotiable rule self-check** — confirm against `.claude/rules/security.md` and `CLAUDE.md` "Things the Agent Commonly Gets Wrong" that the feature didn't introduce a known failure mode (ownership filter, admin guard at class level, server-side totals, atomic stock, no secret/`passwordHash` leak, no token in `localStorage`). If unsure, run `security-reviewer`.

5. **Docs** — invoke `doc-reviewer` or do it directly:
   - Add a `NOTES.md` bullet: what was built, any mistake caught and corrected, design decisions.
   - Tick the completed item(s) in the `CLAUDE.md` Build Order — only if genuinely complete and verified.
   - Update `docs/` if the change is structural or deployment-relevant.

6. **Summarize for the human** — list files changed, the verification results (build/lint/test output), which non-negotiable rules the change touched, and the suggested commit message following the convention in `CLAUDE.md` (`feat: <feature> — <what>`). One feature = one commit.

**Do not run `git commit`.** Present the staged-ready summary and let the human commit.
