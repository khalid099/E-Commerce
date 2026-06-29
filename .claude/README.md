# ShopHive — Agentic Workflow

This directory configures a project-connected agentic workflow for the ShopHive e-commerce monorepo. It encodes *how* work gets done here: specialized agents, the rules they obey, reusable skills, shared context, the delivery pipeline, and safety hooks. The authoritative project spec remains [`../CLAUDE.md`](../CLAUDE.md) — this directory operationalizes it.

## Layout

```
.claude/
  agents/      Specialized subagents (developers, reviewers, QA) — invoke via the Task tool
  rules/       The standards agents must follow (the "constitution")
    backend/   nestjs-patterns, typeorm, dto-validation
    frontend/  react, routing, data-fetching, forms, tables
    code-style.md, error-handling.md, security.md
  skills/      Reusable procedures (scaffold a module/page, run the handoff gate)
  context/     Fast-orientation maps (project-map, data-model)
  pipeline/    The end-to-end feature-delivery flow with quality gates
  hooks/       Deterministic guardrails (block edits to real .env files)
  settings.json        Permissions + hook wiring (committed)
  settings.local.json  Personal overrides (git-ignored)
```

## Agents

**Build**
- `be-developer` — NestJS backend features (modules/controllers/services/DTOs/entities).
- `fe-developer` — Next.js 14 frontend (pages, components, the RTK Query + Zustand + TanStack hybrid).
- `frontend-designer` — visual/UX polish on the Tailwind + Radix design system.

**Review** (read-only gates)
- `code-reviewer` — correctness + the non-negotiable rules (default gate).
- `security-reviewer` — auth, ownership, secrets, price/stock/total integrity.
- `api-reviewer` — REST semantics, response envelope, shared-types alignment, Swagger.
- `db-migration-reviewer` — TypeORM schema, money-as-numeric, the synchronize-in-prod hazard, seed idempotency.
- `performance-reviewer` — N+1, pagination, indexes, over-fetch, client-bundle/render cost.
- `accessibility-reviewer` — WCAG AA: semantics, labels, keyboard, focus, contrast.
- `doc-reviewer` — keeps NOTES.md, the Build Order checkboxes, and docs honest.

**Verify**
- `qa-tester` — writes/runs Jest unit + e2e and component tests; exercises flows on the running app.

## Rules
Single source of truth for "how we write code here." Agents read the rule relevant to a change before touching it; reviewers reject diffs that break one. The hard security/data-integrity rules in `rules/security.md` mirror the non-negotiables in `CLAUDE.md`.

## Skills
- `scaffold-nest-module` — new backend feature, project structure.
- `scaffold-storefront-page` — new Next route, correct group/state/states.
- `feature-handoff` — end-of-feature gate: build, lint, test, docs, commit message (human commits).

## Pipeline
`pipeline/feature-delivery.md` is the standard flow: **Plan → Build → Review (parallel gates) → Verify → Document → (human) Commit.** One Build Order item = one commit. A Blocker/Critical finding returns work to the developer agent.

## Conventions baked in
- The frontend state model is a deliberate hybrid: **RTK Query** (catalog), **Zustand** (auth/cart), **TanStack Query** (authenticated reads). Picking the wrong tool is the most common frontend finding.
- Agents **never run `git commit`** — they prepare and summarize; the human commits (per this project's review-of-git-history assessment).
- Secrets are never hand-edited: the `protect-secrets` hook blocks writes to real `.env` files.
