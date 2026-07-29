# Sign-Up Redesign

## Figma Design

Here is the figma link to the Dashboard Redesign

https://www.figma.com/design/B3VsVcIKHTungaxxi9DMcR/Stellopay-Sign-Up?node-id=0-1&t=PHo0BODJtHNEk0M0-1

---

## Bot Mitigation: Honeypot Field + Submission-Rate Guard

### Overview

The sign-up form (`components/auth/sign-up/sign-up-form.tsx`) includes two lightweight client-side bot-mitigation mechanisms, deployed ahead of a full CAPTCHA integration:

1. **Honeypot field** — a visually hidden text input that appears legitimate to automated bots but is invisible to human users.
2. **Minimum-time submission guard** — rejects submissions that occur faster than a reasonable human could fill out the form.

Both guards fail **silently** (no error UI, no console noise) so that automated scripts cannot distinguish a blocked submission from a successful one.

---

### 1. Honeypot Field

#### Location

Inserted immediately before the **Create Account** submit button, inside the `<form>` element.

#### Implementation

```tsx
<div
  aria-hidden="true"
  className="absolute -left-[9999px] -top-[9999px] opacity-0 h-0 w-0 overflow-hidden"
>
  <label htmlFor="honeypot-field" className="sr-only">
    Website
  </label>
  <input
    id="honeypot-field"
    name="website"
    type="text"
    tabIndex={-1}
    autoComplete="off"
    value={honeypotValue}
    onChange={(e) => setHoneypotValue(e.target.value)}
    placeholder="Website"
  />
</div>
```

#### Accessibility (WCAG 2.1 AA)

| Concern | Implementation |
|---------|---------------|
| Screen reader visibility | Parent `<div>` has `aria-hidden="true"` — the entire subtree is removed from the accessibility tree |
| Keyboard navigation | `tabIndex={-1}` excludes the field from natural tab order |
| Visual hiding | Off-screen positioning + zero dimensions + zero opacity — never visible at any viewport |
| Label | Label uses `sr-only` class (redundant with `aria-hidden`, but safe if `aria-hidden` is ever removed) |
| Autocomplete | `autoComplete="off"` prevents password managers / browser autofill |

#### Why not `display: none` or `type="hidden"`?

Sophisticated bots detect and skip fields with `display: none`, `visibility: hidden`, or `type="hidden"`. The chosen technique keeps the element fully in the DOM and renderable, making it indistinguishable from a visible field to automated scrapers.

#### How it works

- The field is named **"website"** — a common honeypot name that many bots auto-fill.
- On form submission, `isSubmissionBlocked()` checks `honeypotValue.trim().length > 0`.
- If the field has any non-whitespace content, submission is silently discarded.
- Even whitespace-only values are rejected (some bots fill spaces).

---

### 2. Minimum-Time Submission Guard

#### Implementation

```tsx
const MINIMUM_FORM_TIME_MS = 3_000; // 3 seconds

// Record mount time
const mountTimeRef = useRef<number>(0);
useEffect(() => {
  mountTimeRef.current = Date.now();
}, []);

// In onSubmit:
const elapsed = Date.now() - mountTimeRef.current;
if (elapsed < MINIMUM_FORM_TIME_MS) {
  return; // silent reject
}
```

#### Rationale

- A human filling out the sign-up form (name, email, password, confirm password, terms checkbox) takes **at least 3 seconds** even when typing quickly.
- Bots can complete the same form in milliseconds.
- The 3-second threshold is a balance between blocking automated scripts and not penalising legitimate fast typists.

#### Silent Failure

Both guards call `return` before `setShowEmailModal(true)`, so:
- The email-verification modal never appears.
- No `alert` role or error message is rendered.
- No console warnings or errors are emitted.
- The form appears to do nothing — bots cannot distinguish this from a successful submission that triggers no visible feedback.

---

### 3. Test Coverage

Tests in `components/auth/sign-up/sign-up-form.test.tsx` cover:

| Test | Scenario |
|------|----------|
| Honeypot renders in DOM | Verifies `input[name="website"]` exists with `type="text"` |
| Honeypot excluded from a11y tree | Proves `queryByRole` does NOT find it (aria-hidden works) |
| Honeypot excluded from tab order | Checks `tabIndex="-1"` |
| Autocomplete disabled | Checks `autoComplete="off"` |
| Deceptive name attribute | Verifies `name="website"` |
| Aria-hidden on wrapper | Confirms parent div has `aria-hidden="true"` |
| Blocks submission when honeypot filled | Form submit does not open modal |
| Blocks submission when honeypot has whitespace | `"   "` is treated as filled |
| Blocks submission below minimum time | 500ms submit silently discarded |
| Boundary: 2,999ms blocked | Exactly one ms below threshold |
| Boundary: 3,000ms allowed | Exactly at threshold (modal opens) |
| Happy path | Both guards pass → modal opens normally |
| Stealth | No dialog/heading appears when blocked |

---

### 4. Future Considerations

- When a CAPTCHA service (e.g., Turnstile, reCAPTCHA v3) is integrated, the honeypot and time guard should remain as complementary first-line defences.
- The `MINIMUM_FORM_TIME_MS` constant can be adjusted based on analytics (e.g., measure the 5th percentile of real-user form-fill times).
- The honeypot field name can be randomised or rotated periodically if a specific name becomes known to bots.

---

## Email Typo Suggestion

### Overview
A common UX issue during sign-up is that users accidentally make typos in the domain part of their email address (e.g. `gmial.com` instead of `gmail.com`). Since format validation passes, the user remains unaware and doesn't receive the verification email.
To resolve this, we offer a non-blocking one-click "did you mean..." correction in the verification modal itself.

### Implementation
- Added a `COMMON_TYPOS` mapping in `components/auth/sign-up/sign-up-email-modal.tsx` to detect frequent typos against known providers (Gmail, Yahoo, Outlook, Hotmail).
- If a typo is detected, a suggestion is shown with a "Yes, fix it" button.
- The UI includes `role="status"` and `aria-live="polite"` so screen readers proactively announce the suggestion.
- The correction applies locally in the modal without forcing a full page reload or form re-entry.

---

## Session-Expired Interstitial Page

### Overview

A dedicated interstitial at `app/auth/session-expired/page.tsx` explains when a user's session has timed out mid-visit. Instead of landing on a bare login form with no explanation, the user sees a clear message and a direct path back, with the original destination preserved as a `returnTo` query parameter.

### Middleware (`middleware.ts`)

The middleware checks for a session cookie (`next-auth.session-token` or `stellopay:session`) on protected routes.

| Route | Behavior |
|-------|----------|
| `/dashboard`, `/transactions`, `/settings`, `/account-summary` | Redirects to `/auth/session-expired?returnTo=<path>` if no session cookie |
| `/auth/*`, `/verify-email`, `/help`, `/offline` | Allowed through (public) |
| Static assets | Excluded via matcher |

Protected routes are defined in `middleware.ts`:

```typescript
const PROTECTED_ROUTES = [
  "/dashboard",
  "/transactions",
  "/settings",
  "/account-summary",
];
```

### Session-Expired Page

**Route:** `/auth/session-expired?returnTo=<original-path>`

**Key behaviors:**
- Explains the session timed out due to inactivity
- Displays the original destination path the user was trying to reach
- Primary CTA: **"Log in again"** — links to `/auth/login?returnTo=<original-path>`
- Secondary link: **"Go to sign in"** — links to `/auth/login` without returnTo
- Follows the same layout as other auth pages (`AuthShowcase` + form column)

### Login Form `returnTo` Support

The login form (`components/auth/login/login-form.tsx`) now:
- Accepts a `returnTo` prop from `app/auth/login/page.tsx`
- On successful password sign-in, redirects to `returnTo ?? "/dashboard"`
- Uses `next/navigation`'s `useRouter().push()`

### Accessibility (WCAG 2.1 AA)

| Concern | Implementation |
|---------|---------------|
| Heading hierarchy | `<h1>` for "Session Expired" heading |
| Color contrast | Button `#92569D` on dark bg passes AA (contrast ratio ≥ 4.5:1) |
| Focus indicators | `focus:ring-2 focus:ring-[#F8D2FE]` on primary CTA |
| Decorative icon | `aria-hidden="true"` on clock icon container |
| Keyboard navigation | All CTAs are native `<a>` elements |
| Descriptive link text | "Log in again" and "Go to sign in" are self-describing |

### Responsive Behavior

| Breakpoint | Layout |
|------------|--------|
| `sm` (640px) | Single-column, centered |
| `md` (768px) | Single-column, centered with showcase below |
| `lg` (1024px) | Two-column: form + showcase side-by-side |
| `xl` (1280px) | Same as lg with max-width constraint |

### Test Coverage

Tests in `app/auth/session-expired/page.test.tsx` cover:

| Test | Scenario |
|------|----------|
| Renders heading | "Session Expired" `<h1>` present |
| Explains inactivity | Body text explains timeout reason |
| Log in again link | Primary CTA links to login with encoded `returnTo` |
| Go to sign in link | Secondary link to login without `returnTo` |
| Shows returnTo path | Original destination displayed when present |
| Defaults to /dashboard | No returnTo param → defaults to dashboard |
| Renders AuthShowcase | Showcase section with timeout description |
| Branding heading | "Stellopay" text rendered |
| Focus styles | Primary CTA has focus ring classes |
| Decorative icon hidden | `aria-hidden="true"` on icon container |

### Cookie Names

The middleware checks these cookies (in order):
1. `next-auth.session-token` — standard next-auth cookie
2. `stellopay:session` — custom session cookie for non-next-auth auth
