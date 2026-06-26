# Contributing

## Package manager

This repo uses **npm** exclusively. `package-lock.json` is the single source of truth for dependency resolution, and CI installs with `npm ci`.

- Install dependencies: `npm install`
- Reproducible install (CI / clean clone): `npm ci`
- Do not use `yarn` or `pnpm` to install or add dependencies — they generate `yarn.lock` / `pnpm-lock.yaml`, which drift from `package-lock.json` and risk inconsistent dependency versions between contributors and CI.
- A `preinstall` check (`scripts/check-package-manager.js`) fails the install if a `yarn.lock` or `pnpm-lock.yaml` file is present in the repo root. If you see that error, delete the stray lockfile and re-run `npm install`.

If you need to add or update a dependency, run `npm install <package>` (or `npm update`) and commit the resulting changes to `package.json` and `package-lock.json` together.

## Development

```bash
npm install
npm run dev        # start the dev server
npm run lint        # ESLint
npm run type-check  # tsc --noEmit
npm run test        # Vitest unit tests with coverage
npm run test:e2e    # Playwright e2e tests (Chromium only)
npm run test:a11y   # axe-core accessibility gate (all browsers)
npm run build       # production build
```

Run lint, type-check, and tests locally before opening a PR.

## Accessibility (a11y) gate

All primary routes must pass an axe-core scan before merging. The gate is enforced by `tests/a11y.spec.ts` and runs in CI under the `a11y-gate` job on every pull request and push to `main`.

### What fails CI

Any **serious** or **critical** axe-core violation that is not explicitly triaged in the `KNOWN_EXCEPTIONS` list inside `tests/a11y.spec.ts` will cause the `a11y-gate` job to fail. Minor and moderate violations are logged as warnings but do not block the build.

### Routes covered

| Route | Viewports tested |
|---|---|
| `/` | Desktop, Mobile (390 × 844), Dark colour scheme |
| `/help/support` | Desktop, Mobile (390 × 844), Dark colour scheme |
| `/settings/preferences` | Desktop (all tabs), Mobile (390 × 844), Dark colour scheme |

### Running the gate locally

```bash
# Requires browsers installed: npx playwright install chromium firefox webkit
npm run test:a11y
```

### Adding a temporary exception

If a violation cannot be fixed immediately, add an entry to `KNOWN_EXCEPTIONS` in `tests/a11y.spec.ts`:

```ts
const KNOWN_EXCEPTIONS: TriagedViolation[] = [
  {
    id: "color-contrast",
    reason: "Hero gradient pending design token update — #123",
  },
];
```

Every exception **must** include a reason and a tracking-issue link. Remove the entry once the underlying issue is resolved. The allowlist is intentionally small — it is not a mechanism for silencing the gate wholesale.
