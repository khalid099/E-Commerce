---
name: scaffold-nest-module
description: Scaffold a new NestJS backend feature module for ShopHive following the project's exact structure (module/controller/service/dto/entities). Use when adding a backend feature like a new resource or endpoint group under apps/backend/src.
---

# Scaffold a NestJS feature module

Create a backend feature that matches the established modules (`orders/`, `cart/`, `products/`). Do not improvise structure — mirror the existing ones.

## Steps

1. **Confirm the feature shape** — resource name (singular PascalCase entity), the endpoints needed, which are public vs admin, and which shared-types response shape it returns.

2. **Create the folder** under `apps/backend/src/<feature>/`:
   ```
   <feature>.module.ts
   <feature>.controller.ts
   <feature>.service.ts
   dto/create-<feature>.dto.ts        (and update-/query- as needed)
   entities/<feature>.entity.ts       (if it introduces a new entity)
   ```

3. **Entity** — follow `.claude/rules/backend/typeorm.md`: UUID PK, `@CreateDateColumn`/`@UpdateDateColumn`, money as `numeric`, `@Exclude()` on secrets, explicit FK columns. Add to the entities list so `DB_SYNCHRONIZE` picks it up in dev.

4. **DTOs** — one per shape, `class-validator` decorators, bounded pagination on queries. See `.claude/rules/backend/dto-validation.md`.

5. **Service** — inject repos with `@InjectRepository`; all logic here; private `mapEntity()` returning the shared-types shape with `Number(...)` coercion on numerics; typed Nest exceptions; `dataSource.transaction()` for multi-write consistency; atomic conditional UPDATEs for counters/stock.

6. **Controller** — thin; class-level guards; public vs admin = two controllers in one file (admin = `@UseGuards(JwtAuthGuard, RolesGuard)` + `@Roles(UserRole.ADMIN)` at class level); `@CurrentUser()` for ownership; `ParseUUIDPipe` on id params; `@ApiOperation` on every route.

7. **Module** — `TypeOrmModule.forFeature([...])`, declare controllers/providers, export the service only if another module needs it. Register the module in `app.module.ts`.

8. **Verify** — `cd apps/backend && npx tsc --noEmit`. If `DB_SYNCHRONIZE=true`, start the app and confirm the table generates.

9. **Hand off to review** — `api-reviewer` (contract), `security-reviewer` (if it touches user data/auth), `code-reviewer`. Do not commit; the human commits.
