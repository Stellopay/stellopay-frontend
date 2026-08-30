# Security Headers — Production Preview Check

This document explains the acceptance-criteria test added for
[#1174](https://github.com/Stellopay/stellopay-frontend/issues/1174): make the
deployed preview prove it serves the intended security policy.

## Outcome

- Required headers (`Content-Security-Policy`, `X-Frame-Options`,
  `Strict-Transport-Security`, `Referrer-Policy`, `X-Content-Type-Options`)
  are asserted on representative routes and a hashed static asset.
- The policy rejects unsafe inline scripts (`'unsafe-inline'`, `'unsafe-eval'`
  in `script-src`) and cross-origin framing (`frame-ancestors 'none'`).
- Failures name the missing or weakened header and directive.

## Source of truth

The exact header values live once in `lib/security-headers.ts` and are wired
into `next.config.ts` via the `headers()` hook. Both the unit tests
(`lib/security-headers.test.ts`) and the preview check
(`tests/security-headers.spec.ts`) import that module, so the policy cannot
drift from what the server actually sends.

## Validation

### 1. Unit coverage

```bash
npx vitest run lib/security-headers.test.ts --coverage.enabled=false
```

### 2. Against a local production build

Build and run the production server, then point the preview check at it:

```bash
npm run build
npm run start   # next start, default port 3000
npm run test:security-headers
```

### 3. Against a configured preview

Point Playwright at the deployment URL:

```bash
BASE_URL=https://<preview-url> npx playwright test tests/security-headers.spec.ts --project=chromium
```

The check uses `request.get()` with redirect-following, so authenticated
routes that 307 to the public session-expired page still get their headers
verified on the final response.