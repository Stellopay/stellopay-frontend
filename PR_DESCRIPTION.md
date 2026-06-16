# fix(auth): squeaky clean refactoring of auth forms and typescript/lint errors

## Summary

Fixes a **render-blocking `ReferenceError`** in both authentication forms (`LoginForm` and `SignUpForm`) that made `/auth/login` and `/auth/sign-up` completely non-functional.

During the fix, it was discovered that the root cause was the incorrect usage of a custom `render` prop on the `FormFieldPassword` component. `FormFieldPassword` is a self-contained component that intrinsically handles the password visibility toggle (`Eye`/`EyeOff`), ARIA attributes, and state management.

This PR provides a **squeaky clean** refactor that resolves the runtime errors, as well as several pre-existing TypeScript errors and ESLint warnings across the project.

## Changes

### 1. Auth Forms Refactor (`login-form.tsx` & `sign-up-form.tsx`)
- Removed the unsupported `render` prop and replaced it with declarative usage of `FormFieldPassword`.
- Cleaned up unused state (`showPassword`, `showConfirmPassword`) and imports (`Eye`, `EyeOff`, etc.) since `FormFieldPassword` handles them internally.
- Forwarded the `onChange` event in `SignUpForm` to maintain password strength checking functionality.

### 2. TypeScript Error Fixes
- **Image Imports:** Added `global.d.ts` to declare `.png` and other static image modules, resolving `TS2307: Cannot find module` errors across the application.
- **FormField Component:** Fixed explicit `any` casts in the custom `onChange` forwarder in `form-field.tsx` (`TS2322`).

### 3. ESLint Warning Fixes
- **Hero Component (`hero.tsx`):** Replaced raw `<img>` tags with Next.js `<Image />` component to resolve `@next/next/no-img-element` warnings and improve LCP performance.
- **Unused Variables:** Used destructuring rename (`indeterminate: _indeterminate`) in `form-field.tsx` to fix `@typescript-eslint/no-unused-vars` warnings.
- **Login Form:** Renamed unused `data` parameter in submit handler to `_data`.

### 4. End-to-End Tests (`tests/auth-forms.spec.ts`)
- Added comprehensive Playwright e2e test suite covering both pages.
- Validates that fields default to `type="password"` (hidden).
- Validates the password toggle switches input type and updates `aria-label` accordingly.
- Verifies that `autoComplete` attributes are preserved (`current-password` / `new-password`).

## 🔒 Security Notes
- Password visibility **defaults to hidden** (`type="password"`).
- Password values are **never logged**.
- `autoComplete` attributes are explicitly preserved to ensure password managers continue to function correctly.

## Verification
- **Runtime:** `/auth/login` and `/auth/sign-up` render perfectly without runtime errors.
- **TypeScript:** `npx tsc --noEmit` passes with **0 errors**.
- **ESLint:** `npx next lint` passes with **0 warnings and 0 errors**.
- **Tests:** `npx playwright test tests/auth-forms.spec.ts` passes.

---

Closes #252
