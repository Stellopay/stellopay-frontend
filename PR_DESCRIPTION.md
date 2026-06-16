# fix(auth): declare `showPassword` state and import `Eye`/`EyeOff` in auth forms

## Summary

Fixes a **render-blocking `ReferenceError`** in both authentication forms (`LoginForm` and `SignUpForm`) caused by undeclared identifiers:

- `showPassword` / `setShowPassword` (and `showConfirmPassword` / `setShowConfirmPassword` in sign-up)
- `Eye` / `EyeOff` icon components from `lucide-react`
- `iconsClassName` positioning constant

This bug made `/auth/login` and `/auth/sign-up` completely non-functional — the forms could not render at all.

## Changes

### `components/auth/login/login-form.tsx`

| Change | Detail |
|--------|--------|
| **Import** | Added `Eye`, `EyeOff` to the `lucide-react` import |
| **State** | Added `const [showPassword, setShowPassword] = useState(false)` |
| **Constant** | Added `iconsClassName` for toggle button positioning (`absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground`) |

### `components/auth/sign-up/sign-up-form.tsx`

| Change | Detail |
|--------|--------|
| **Import** | Added `Eye`, `EyeOff` to the `lucide-react` import |
| **State** | Added `const [showPassword, setShowPassword] = useState(false)` |
| **State** | Added `const [showConfirmPassword, setShowConfirmPassword] = useState(false)` |
| **Constant** | Added `iconsClassName` for toggle button positioning |

### `tests/auth-forms.spec.ts` *(new)*

Comprehensive Playwright e2e test suite covering:

- ✅ Both pages render without console errors
- ✅ Password fields default to `type="password"` (hidden)
- ✅ Toggle switches `type` between `password` ↔ `text`
- ✅ `aria-pressed` and `aria-label` update on toggle click
- ✅ `autoComplete` attributes are preserved (`current-password` / `new-password`)
- ✅ All three toggle instances tested (login password, sign-up password, sign-up confirm password)

## 🔒 Security Notes

- Password visibility **defaults to hidden** (`type="password"`)
- Password values are **never logged** — the existing `console.error` only logs the error object, and the sign-up `onSubmit` explicitly avoids sensitive data logging
- `autoComplete` attributes are preserved:
  - `current-password` on login
  - `new-password` on sign-up (both fields)
- This ensures password managers continue to function correctly

## Testing

```bash
npx playwright test tests/auth-forms.spec.ts
```

## Acceptance Criteria

- [x] `/auth/login` and `/auth/sign-up` render without runtime `ReferenceError`s
- [x] Password visibility toggle works on all three fields
- [x] Toggle defaults to hidden and exposes correct `aria-label` / `aria-pressed`
- [x] Playwright spec covering the toggle passes
- [x] `autoComplete` attributes preserved for password manager compatibility

---

Closes #252
