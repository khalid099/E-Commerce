# Rule — Forms

Every form: `react-hook-form` for state, `zod` for the schema, `@hookform/resolvers/zodResolver` to bind them. No uncontrolled hand-managed forms.

## Pattern

```typescript
const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8, 'At least 8 characters'),
});
type Values = z.infer<typeof schema>;

const form = useForm<Values>({ resolver: zodResolver(schema) });
```

- The zod schema is the single source of validation truth on the client. Keep client rules consistent with the backend DTO (`@MinLength(8)` ↔ `.min(8)`) so the user isn't surprised by a server 400 that passed client validation.
- Client validation is UX only — it is **never** the security boundary. The backend DTO re-validates everything (see [../backend/dto-validation.md](../backend/dto-validation.md)).

## Rendering & a11y

- Each field has a `<label htmlFor>` (Radix `Label`) tied to the input id.
- Show the field error from `formState.errors[name].message` adjacent to the input, with `aria-invalid` and `aria-describedby` pointing at the error node.
- Disable the submit button while `isSubmitting`; show inline progress, not a frozen UI.

## Submission

- On submit, call the API through the Axios `api` instance. On success, toast + navigate/refresh. On failure, read the server `message` via `lib/errors.ts` and surface it — map field-specific server errors back onto the field where possible, otherwise show a form-level error.
- Money/number inputs parse to numbers before sending; never send `"12.00"` where the DTO expects a `number`.
- Never send client-computed totals — the server computes order totals. The checkout form submits the address and payment intent, not a price.

## Reference forms

- `components/admin/ProductForm.tsx` — create/edit product, including image upload (multipart to `/admin/products/:id/image`).
- `(auth)/login`, `(auth)/register` — the canonical auth form pattern.
