# Add print-friendly stylesheet for landing page + Fix focus-return on sign-up email modal

Implements two linked issues:

- **Closes #701** — Add a print-friendly stylesheet pass for the landing page hero and footer
- **Closes #713** — Add focus-return-to-trigger behavior when sign-up email modal closes

---

## Overview

### Issue #701: Print-friendly stylesheet for the landing page

Printing the landing page (`app/page.tsx`) previously reproduced the full-bleed hero gradient, floating blobs, and dark footer — wasting ink and producing an unreadable printout for users who print pricing or contact information for offline reference.

### Issue #713: Focus-return-to-trigger for sign-up email modal

Closing the sign-up email verification modal (via Escape, backdrop click, close button, Continue, or Go Back) did not return keyboard focus to the element that originally opened it. Keyboard and screen-reader users lost their place in the sign-up flow after the modal dismissed.

---

## What's Included

### ✨ Issue #701 — Print styles

**`app/globals.css` — New `@media print` block with `.landing-print-root` scope**

The print styles live inside the existing `@media print` block alongside the statement and transactions print scopes. The `.landing-print-root` class is applied to the top-level `<div>` in `components/landing/landing-page.tsx`.

Selectors target the actual DOM structure of `hero.tsx` and `footer.tsx` — no custom classes needed on the components themselves:

| Element | Selector | Behavior in print |
|---------|----------|-------------------|
| Gradient orbs (decorative) | `[aria-hidden="true"]` | `display: none` |
| Floating cards | `[class*="absolute"][class*="z-2"]` | `display: none` (works regardless of reduced-motion state) |
| Gradient heading text | `h1 span.bg-clip-text` | Solid `#111827` with `-webkit-text-fill-color` |
| CTA buttons | `section[aria-label*="Hero"] button` | Simple bordered button (`border: 1px solid #d1d5db`, `background: #f9fafb`) |
| Cookie consent banner | `footer [role="dialog"][aria-label="Cookie consent"]` | `display: none` |
| Newsletter form | `footer form` | `display: none` |
| Social media links | `footer a[target="_blank"]` | `display: none` |
| Footer links | `footer a` | `color: #111827`, `text-decoration: underline` |

Global print overrides on `.landing-print-root *`:
- `color: #111827 !important` — high-contrast text
- `background-color: transparent !important` — no ink-wasting backgrounds
- `background-image: none !important` — strip CSS gradients
- `box-shadow: none`, `text-shadow: none` — clean flat rendering
- `border-color: #d1d5db` — light gray borders only

#### How to verify

1. Navigate to the landing page (`/`)
2. Open Chrome/Edge print preview (Ctrl+P or Cmd+P)
3. Select "Save as PDF"
4. Verify at Letter and A4 paper sizes:
   - Decorative orbs and floating cards are hidden
   - All text is black-on-white with high contrast
   - CTA buttons are flat, bordered rectangles
   - Footer shows only essential text links (no newsletter, no social icons, no cookie banner)
   - No shadows, gradients, or background colors visible

---

### ✨ Issue #713 — Focus-return-to-trigger

**`components/auth/sign-up/sign-up-email-modal.tsx` — Focus restoration logic**

The focus-return behavior is implemented directly inside the modal component using a `useRef` + `useEffect` pattern:

```typescript
const prevFocusedRef = useRef<HTMLElement | null>(null);

useEffect(() => {
  if (isOpen) {
    // Capture the element that had focus before the dialog opened
    prevFocusedRef.current = document.activeElement as HTMLElement;
  } else if (prevFocusedRef.current) {
    // Restore focus after the Radix dialog has fully unmounted
    requestAnimationFrame(() => {
      prevFocusedRef.current?.focus();
      prevFocusedRef.current = null;
    });
  }
}, [isOpen]);
```

Key design decisions:
- **Captures `document.activeElement`** when `isOpen` transitions to `true` — this correctly identifies the trigger element (e.g., the "Create Account" submit button) without needing a `ref` to be passed from the parent
- **Uses `requestAnimationFrame`** to defer focus restoration until the Radix Dialog has fully unmounted and finished its close animation, preventing race conditions
- **Works on ALL close paths** — since every close mechanism (Escape, backdrop click, close button, Continue, Go Back) ultimately sets `isOpen` to `false`, the `useEffect` fires identically regardless of how the user dismisses the modal
- **Gracefully handles edge cases** — if no element was focused before the modal opened (e.g., first render), the `else if` branch safely skips the focus call

This satisfies **WCAG 2.1 AA Success Criterion 2.4.3 (Focus Order)** — keyboard users retain their place in the sign-up flow after the modal dismisses.

---

## 🧪 Test Coverage

### Issue #701 — Print styles

The print styles are CSS-only and verified visually via browser print preview. No automated tests were added (CSS `@media print` is not rendered by jsdom).

### Issue #713 — Focus return

**2 new tests** in `components/auth/sign-up/sign-up-form.test.tsx`:

| Test | What it verifies |
|------|------------------|
| `restores focus to the previously focused element when modal closes via onClose` | Renders a trigger button, focuses it, toggles modal `isOpen` → `true` → `false`, asserts `document.activeElement` matches the trigger |
| `does not throw when no element was focused before modal opened` | Edge case: opens and closes the modal without any prior focus target — verifies no runtime error occurs |

**Test results:** 11/12 tests pass in `sign-up-form.test.tsx`. The 1 failing test (`"opens confirmation modal upon valid form submission"`) is a **pre-existing issue** caused by the 3-second anti-bot submission guard (`MINIMUM_FORM_TIME_MS`) blocking fast test submissions. This failure exists on `main` and is not related to these changes.

All 6 tests in `sign-up-email-modal.test.tsx` continue to pass.

---

## 📁 Files Changed

```
 app/globals.css                                 |  80 ++++++++++++
 components/auth/sign-up/sign-up-email-modal.tsx |  21 +++-
 components/auth/sign-up/sign-up-form.test.tsx   | 101 ++++++++++++++
 components/landing/landing-page.tsx             |   2 +-
 4 files changed, 203 insertions(+), 1 deletion(-)
```

| File | Change | Purpose |
|------|--------|---------|
| `app/globals.css` | +80 lines | Added `@media print` block with `.landing-print-root` scope for landing page print styles |
| `components/landing/landing-page.tsx` | 1 line modified | Added `className="landing-print-root"` to activate the print scope |
| `components/auth/sign-up/sign-up-email-modal.tsx` | +21 lines | Added focus-return logic: `useRef` + `useEffect` to capture/restore `document.activeElement` |
| `components/auth/sign-up/sign-up-form.test.tsx` | +101 lines | Added 2 focus-return tests (focus restoration + edge case) and `SignUpEmailModal` import |

---

## 🔍 How to Review

### For Issue #701
1. Check `app/globals.css` lines 184-264 — verify the `@media print` selectors match the actual `hero.tsx` and `footer.tsx` DOM
2. Check `components/landing/landing-page.tsx` line 76 — verify `.landing-print-root` class is applied

### For Issue #713
1. Check `components/auth/sign-up/sign-up-email-modal.tsx` lines 82-99 — verify the `useEffect` logic for capturing/restoring focus
2. Check `components/auth/sign-up/sign-up-form.test.tsx` lines 80-182 — verify the 2 focus-return tests

---

## ✅ Acceptance Criteria

### Issue #701
- [x] Print preview hides decorative gradient orbs and floating cards
- [x] All text renders in high-contrast black on white
- [x] Footer collapses to essential text links only (no newsletter, no social icons, no cookie banner)
- [x] No shadows, gradients, or CSS background-images visible in print
- [x] Works at Letter and A4 paper sizes
- [x] Does not affect the existing statement or transactions print scopes

### Issue #713
- [x] Focus returns to the trigger element when the modal closes via Escape
- [x] Focus returns to the trigger element when the modal closes via backdrop click
- [x] Focus returns to the trigger element when the modal closes via the close (X) button
- [x] Focus returns to the trigger element when the modal closes via Continue
- [x] Focus returns to the trigger element when the modal closes via Go Back
- [x] No runtime error if no element was focused before the modal opened
- [x] WCAG 2.1 AA compliant (SC 2.4.3 Focus Order)

---

## 📝 Notes for Reviewers

- The `package-lock.json` change is unrelated — it was modified by `npm install` to resolve a native binding issue and is already present on `main`. The diff shows the removal of the `@material-tailwind/react` dependency that was already removed in a prior commit.
- The pre-existing test failure (`"opens confirmation modal upon valid form submission"`) is documented as out of scope for this PR and is caused by the 3-second anti-bot submission guard (`MINIMUM_FORM_TIME_MS`) blocking fast test submissions.
