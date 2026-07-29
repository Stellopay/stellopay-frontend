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
