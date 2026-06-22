# TODO - fix stale transaction fetches

## Step 1: Cancellation threading

- [x] Update `lib/api/transactions.ts#getTransactions` to accept optional `AbortSignal`
- [x] Implement abortable delay and abort checks

## Step 2: Hook request cancellation + latest-commit guard

- [x] Update `hooks/useTransactions.ts` to create `AbortController` per effect run
- [x] Abort previous request in cleanup
- [x] Add requestId guard so only latest request commits state
- [x] Ensure no setState after unmount

## Step 3: Tests

- [x] Create `hooks/useTransactions.test.ts`
- [x] Simulate overlapping resolutions and assert last-request-wins
- [x] Simulate unmount mid-flight and ensure no stale state commit / no unhandled rejection

## Step 4: Documentation

- [ ] Add TSDoc comments documenting cancellation semantics

## Step 5: Run & verify

- [ ] Run `npm run test`
- [ ] Confirm Vitest coverage thresholds pass
