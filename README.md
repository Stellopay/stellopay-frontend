This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

Please see our [Contributing Guide](CONTRIBUTING.md) for details on project structure, the data-layer pattern, testing, and conventions.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

```
stellopay-frontend
├─ .eslintrc.json
├─ .hintrc
├─ app
│  ├─ account-summary
│  │  └─ page.tsx
│  ├─ components
│  │  ├─ Button.tsx
│  │  ├─ EmailInput.tsx
│  │  ├─ FaqCard.tsx
│  │  ├─ TextAreaInput.tsx
│  │  ├─ TextInput.tsx
│  │  └─ ToggleCard.tsx
│  ├─ favicon.ico
│  ├─ globals.css
│  ├─ help
│  │  └─ support
│  │     └─ page.tsx
│  ├─ layout.tsx
│  ├─ page.tsx
│  └─ settings
│     ├─ preferences
│     │  ├─ components
│     │  │  └─ SecurityTab.tsx
│     │  ├─ Image.png
│     │  └─ page.tsx
│     └─ profile
│        ├─ components
│        │  └─ ProfileTab.tsx
│        └─ page.tsx
├─ components
│  ├─ icons
│  │  └─ BellFillIcon.tsx
│  ├─ NotificationPanel.tsx
│  └─ ui
│     └─ button.tsx
├─ components.json
├─ design
│  └─ figma-design.txt
├─ lib
│  └─ utils.ts
├─ next.config.ts
├─ package-lock.json
├─ package.json
├─ postcss.config.mjs
├─ public
│  ├─ bank.png
│  ├─ file.svg
│  ├─ globe.svg
│  ├─ Icon.png
│  ├─ next.svg
│  ├─ piggy-bank.png
│  ├─ vercel.svg
│  └─ window.svg
├─ README.md
├─ tsconfig.json
└─ types
   └─ NotificationItem.tsx

```

## Testing

- `npm run test` runs the Vitest unit suite with coverage for auth, transaction, and pagination utils plus auth schemas.
- `npm run test:watch` runs Vitest in watch mode while developing unit tests.
- `npm run test:e2e` is the Playwright local/E2E command.

## CI Pipeline

Every pull request and push to `main` runs the following steps via `.github/workflows/ci.yml`:

| Step | Command | Purpose |
|------|---------|---------|
| Install dependencies | `npm ci` | Reproducible install from lockfile |
| Unit Tests | `npm run test` | Vitest utility/schema tests for auth, transaction, pagination utils, and auth schemas |
| Lint | `npm run lint` | ESLint via `next lint` |
| Type-check | `npm run type-check` | `tsc --noEmit` — catches type errors |
| Build | `npm run build` | Full Next.js production build |

**Node version:** 20 LTS (matches `@types/node ^20`).

**Security:** workflow permissions are `contents: read`; actions are pinned to major version tags; `pull_request` trigger is used (not `pull_request_target`) so fork PRs cannot access repository secrets.

## ⚡ Performance Optimization & Code-Splitting

We implemented target performance optimizations across the landing page and dashboard to improve First Paint, LCP (Largest Contentful Paint), and TBT (Total Blocking Time).

### Key Changes
1. **Below-the-Fold Dynamic Imports**: Code-split `HowItWorks`, `EnterpriseSolutionSection`, and `FAQSection` on the landing page ([pages/landing/index.tsx](file:///home/henry/projects/open-source/stellopay-frontend/pages/landing/index.tsx)) using `next/dynamic` to keep the initial HTML payload lightweight.
2. **Chart & Insights Code-Splitting**: Dynamically loaded the recharts-heavy component ([AnalyticsViews](file:///home/henry/projects/open-source/stellopay-frontend/components/analytics/client-analytics-view.tsx)) and KPI metrics ([AnalyticsInsights](file:///home/henry/projects/open-source/stellopay-frontend/components/dashboard/dashboard-page.tsx)) with structural skeleton fallbacks equipped with accessibility attributes (`aria-busy="true"` and `aria-live="polite"`).
3. **Optimized Layout Animations**: Replaced `framer-motion` JS-driven layout width transitions on the sidebar container ([components/common/side-bar.tsx](file:///home/henry/projects/open-source/stellopay-frontend/components/common/side-bar.tsx)) with pure CSS grid animations to prevent layout thrashing and lower Total Blocking Time (TBT).
4. **Hero Image Optimization**: Upgraded native `img` tags for the network logo assets inside the above-the-fold Hero component ([components/landing/hero.tsx](file:///home/henry/projects/open-source/stellopay-frontend/components/landing/hero.tsx)) to Next.js `Image` components with explicit dimensions.

### Bundle Size Impact (`next build` Route JS)

| Route | Metric | Before | After | Change |
|-------|--------|--------|-------|--------|
| `/landing` (Pages Router) | Route Size | 64.1 kB | 26.1 kB | **-38.0 kB (-59.3%)** |
| `/landing` (Pages Router) | First Load JS | 165 kB | 127 kB | **-38.0 kB (-23.0%)** |

## Centralized Demo Data & Illustrative Stats

To prevent hardcoded realistic PII (Personal Identifiable Information) and fabricated marketing trust metrics from being shipped inline in production components, this project uses a centralized demo-data configuration located at `lib/demo-data.ts`.

- **Security Compliance**: All mockup emails, phone numbers, and wallet addresses are set to standard, obvious placeholder domains/values (e.g. `example.com`, `+1 555 0100`, and redacted addresses like `GB-REDACTED-DEMO-STELLAR-ADDRESS-XXXX`). This reduces compliance exposure and prevents test/seed data from being mistaken for active production credentials.
- **Illustrative Marketing Stats**: Landing page statistics are managed via the same config file and clearly decorated with visual badges indicating they are illustrative placeholders.
- **Backend Integration**: These structures are designed to be easily replaced by backend API hooks once user authentication, profile retrieval, and wallet connectivity endpoints are finalized.

