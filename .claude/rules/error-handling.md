# Rule — Error Handling

A consistent error contract across the stack. The client must never see a raw stack trace, and the frontend must always know how to render a failure.

## The response contract

Every successful response is wrapped by `TransformInterceptor` into:

```json
{ "success": true, "data": <payload> }
```

Paginated payloads are `PaginatedResponse<T>` from `@ecommerce/shared-types` (`{ items, total, page, limit, totalPages }`). The interceptor wraps the whole thing — services return the bare `data`, never the envelope.

Every failure is shaped by the global exception filter (`common/filters/http-exception.filter.ts`):

```json
{ "success": false, "statusCode": 409, "message": "Insufficient stock", "timestamp": "...", "path": "/api/orders" }
```

## Backend rules

- **Throw Nest HTTP exceptions, never generic `Error`** for expected failures: `NotFoundException`, `ConflictException`, `BadRequestException`, `ForbiddenException`, `UnauthorizedException`.
- **Map domain conditions to the right status:**
  - Not found / not owned → `NotFoundException` (never reveal that a resource exists but belongs to someone else).
  - Stock conflict, duplicate cart, illegal status transition → `ConflictException`.
  - Bad input that DTO validation can't express → `BadRequestException`.
- **The global filter is the only place that touches unknown errors.** It logs the full error server-side with `Logger` and returns a generic `500` message. Never add a per-controller try/catch that swallows and re-shapes errors.
- **Validation errors** come from `ValidationPipe` (`whitelist: true, forbidNonWhitelisted: true, transform: true`). Do not hand-validate what a DTO decorator already covers.
- The illegal-status-transition guard in `OrdersService` is the reference pattern: validate against `ORDER_STATUS_TRANSITIONS` and throw `ConflictException` with a human message.

## Frontend rules

- All API calls go through the Axios `api` instance (`lib/api.ts`). It already handles the global 401 → redirect-to-login flow; do not duplicate that per-call.
- Read failures off the error envelope with the helper in `lib/errors.ts`. Show the server `message`; never render `error.toString()` or a stack.
- RTK Query and TanStack Query expose `isError`/`error` — every data-driven view must render an error state and a retry affordance, not a blank screen.
- Mutations show a toast on success and on failure. A silent mutation is a bug.
- Never trust a 200 to mean success in isolation — check `success` if you read the raw body, though RTK Query's `transformResponse` already unwraps `.data` for you.
