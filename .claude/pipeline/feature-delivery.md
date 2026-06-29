# Pipeline — Feature Delivery

The standard agentic flow for shipping one Build Order item on ShopHive. It is a pipeline of specialized agents with explicit quality gates. The human owns the final commit.

## Principle
One feature → one branch of work → one commit. Build, then review through independent lenses, then verify, then document. A gate that fails sends the work back to the developer agent; it does not get waved through.

## Stages

### 1. Plan
Read `CLAUDE.md` (Build Order — work the next unticked item, never skip ahead), `.claude/context/*`, and the relevant rules. Produce a short plan: endpoints/components, shared-types changes, which non-negotiable rules apply.

### 2. Build
- Backend work → **be-developer** (skill: `scaffold-nest-module`).
- Frontend work → **fe-developer** (skill: `scaffold-storefront-page`).
- A full-stack feature builds backend first (contract + shared-types), then frontend against the real contract.

### 3. Review (gates — run the relevant ones; they are read-only and can run in parallel)
| Gate | Agent | Runs when |
|---|---|---|
| Correctness + rules | **code-reviewer** | always |
| Security + ownership + integrity | **security-reviewer** | auth, orders, payments, admin, env, any user-owned data |
| API contract + type alignment | **api-reviewer** | any endpoint added/changed |
| Schema / migration / synchronize | **db-migration-reviewer** | any entity, migration, or seed change |
| Performance | **performance-reviewer** | list/search endpoints, dashboard, data-heavy pages |
| Accessibility | **accessibility-reviewer** | any UI change |
| Visual/UX polish | **frontend-designer** | new or restyled screens |

**Gate rule:** any **Blocker/Critical** finding returns the work to the developer agent. Re-review the fix. Nits are optional.

### 4. Verify
**qa-tester** writes/runs the tests that cover the feature's risk (stock atomicity, totals, ownership, auth roundtrip) and/or exercises the flow against the running app. Report real results — never claim green without running.

### 5. Document & hand off
**doc-reviewer** (skill: `feature-handoff`): update `NOTES.md`, flip the `CLAUDE.md` Build Order checkbox, refresh `docs/` if structural. Produce the suggested commit message per convention.

### 6. Commit
The **human** commits. Agents never run `git commit`.

## Typical fan-outs
- *Backend endpoint:* be-developer → (code + security + api + db reviewers in parallel) → qa-tester → doc-reviewer.
- *Storefront screen:* fe-developer → (code + accessibility reviewers + frontend-designer) → qa-tester → doc-reviewer.
- *Full-stack feature:* backend pipeline → frontend pipeline → end-to-end qa-tester → doc-reviewer.
