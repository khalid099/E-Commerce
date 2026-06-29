# Rule — DTO Validation

Every request body and every set of query params crosses the boundary through a DTO decorated with `class-validator`. No exceptions — an endpoint without a DTO is an incomplete endpoint.

## Principles

- The global `ValidationPipe` runs with `whitelist: true`, `forbidNonWhitelisted: true`, `transform: true`. Unknown fields are stripped; declared-but-wrong fields 400 automatically. Trust it — do not re-validate in the service what a decorator already guarantees.
- `transform: true` means query strings coerce to their declared types. Use `@Type(() => Number)` on numeric query fields so `?page=2` becomes a number, not `"2"`.
- One DTO per shape: `create-*.dto.ts`, `update-*.dto.ts`, `query-*.dto.ts`. Updates use `PartialType(CreateDto)` rather than re-declaring fields.

## Body DTO

```typescript
export class CreateProductDto {
  @IsString() @IsNotEmpty() @MaxLength(255)
  name: string;

  @IsNumber() @IsPositive()
  price: number;

  @IsInt() @Min(0)
  stockQuantity: number;

  @IsUUID()
  categoryId: string;
}
```

## Query DTO — the abuse cases that must be handled

`GET /products?page=-1&limit=999` must not reach the database with those values.

```typescript
export class QueryProductDto {
  @IsOptional() @IsString()
  search?: string;

  @IsOptional() @Type(() => Number) @IsInt() @Min(1)
  page = 1;

  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(50)
  limit = 20;

  @IsOptional() @IsEnum(SortBy)
  sortBy?: SortBy;
}
```

- Always bound `limit` with `@Max` so a client cannot request the whole table.
- Always floor `page`/`limit` at `@Min(1)`.
- Enumerated inputs (sort keys, statuses) use `@IsEnum`, never a free string compared in the service.
- Default values on the property double as documentation and post-validation fallbacks.

## Money & ids

- Prices: `@IsNumber()` + `@IsPositive()`. Quantities: `@IsInt()` + `@Min(1)` (cart) or `@Min(0)` (stock).
- All ids that are entity keys: `@IsUUID()`.
- Status updates: `@IsEnum(OrderStatus)` — the transition legality is then checked in the service, not the DTO.
