# TODO — docs(readme) and date utils consolidation

## Phase 1: README rewrite + date utils consolidation

- [x] Update `README.md` (replace boilerplate; correct directory layout; add setup/scripts/testing/stack)
- [x] Consolidate date utilities into a single module (`utils/date-utils.ts`, date-fns based)
- [x] Remove redundant `utils/dateUtils.ts` (deleted; no longer present)
- [x] Update all imports across the repo to the surviving date utility module
- [x] Add TSDoc to surviving date utility exports
- [x] Add unit tests: `utils/date-utils.test.ts` (parse/range/format edge cases, colocated per repo convention alongside `authUtils.test.ts`/`paginationUtils.test.ts`/`transactionUtils.test.ts`)

## Phase 2: Validation

- [x] Run `npm run test` (Vitest, includes `utils/date-utils.test.ts` with coverage)
- [x] Ensure tests pass and coverage thresholds (95%) for the suite remain satisfied (98%+ overall, 100% branches in `date-utils.ts`)
- [x] Run `npm run lint` and `npx tsc --noEmit` against changed files

## Phase 3: Final checks

- [x] Verify no remaining imports of removed date utils modules
- [x] Double-check README does not leak secrets/env values (also removed pre-existing absolute local file paths leaking contributor usernames)
