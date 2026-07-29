# Form Design System

Standardized form patterns for Stellopay to ensure consistent validation, loading, and feedback states.

## Shared Tokens

We use semantic tokens for form states to ensure brand consistency:

- **Error**: `--destructive` (e.g., `text-destructive`, `border-destructive`)
- **Success**: `--success` (e.g., `text-success`, `border-success`)
- **Warning**: `--warning` (e.g., `text-warning`, `border-warning`)
- **Disabled**: `disabled:opacity-50 disabled:cursor-not-allowed`

## Components

### 1. Input

The base `Input` component handles all semantic states:

- `error`: Red border and ring.
- `success`: Green border and ring.
- `warning`: Amber border and ring.
- `loading`: Shows a spinner on the right.

### 2. FormField (Abstractions)

Use high-level abstractions for common patterns:

- `AuthFormField`: Reusable field wrapper for authentication forms (`LoginForm`, `SignUpForm`) that unifies label, error message, input wrapper markup, and automatically delegates to `FormFieldPassword` when `type="password"` or `FormFieldInput` for text/email fields.
- `FormFieldInput`: Standard text/email inputs.
- `FormFieldPassword`: Password input with show/hide toggle.
- `FormFieldCheckbox`: Checkbox with label alignment.
- `FormFieldTextarea`: Multi-line text input.

## Usage Patterns

### Standard Text Input

```tsx
<FormFieldInput
  control={form.control}
  name="email"
  label="Email Address"
  placeholder="enter@email.com"
  required
/>
```

### Password Input

```tsx
<FormFieldPassword
  control={form.control}
  name="password"
  label="Password"
  placeholder="••••••••"
  required
/>
```

### Loading State

```tsx
<FormFieldInput
  control={form.control}
  name="username"
  label="Username"
  loading={isCheckingAvailability}
  description="Checking availability..."
/>
```

### Feedback Messages

```tsx
// Success message
<FormFieldInput
  control={form.control}
  name="referral"
  label="Referral Code"
  success={true}
  successMessage="Code applied successfully!"
/>

// Warning message
<FormFieldInput
  control={form.control}
  name="password"
  label="Password"
  warning={true}
  warningMessage="Your password is weak, but acceptable."
/>
```

## Do's and Don'ts

### Do

- ✅ Always use `FormField` abstractions for consistent layout.
- ✅ Provide clear, actionable error messages.
- ✅ Use the `loading` state for async validation or submission.
- ✅ Use `FormFieldPassword` for all sensitive inputs.
- ✅ Ensure all required fields are marked with `required`.

### Don't

- ❌ Don't log sensitive form data to the console.
- ❌ Don't use manual `Input` and `label` unless absolutely necessary.
- ❌ Don't use hardcoded colors for states; use semantic tokens.
- ❌ Don't hide error messages; always use `FormMessage`.

## Security & Password Managers

- **No Console Logs**: Ensure `onSubmit` handlers do not log raw form data in production.
- **Auto-complete**: Use appropriate `autoComplete` values across all auth and settings fields to ensure password managers (Bitwarden, 1Password, iCloud Keychain) and browser autofill function seamlessly:
  - Login email: `autoComplete="email"` and `inputMode="email"`
  - Login password: `autoComplete="current-password"`
  - Sign-up / Reset password: `autoComplete="new-password"`
  - Full Name: `autoComplete="name"`
  - Verification / 2FA OTP codes: `autoComplete="one-time-code"` and `inputMode="numeric"`
- **Mobile soft-keyboard optimization**: Always specify `inputMode` (`"email"` for email inputs, `"numeric"` for OTP inputs, etc.) so mobile keyboards automatically trigger the optimal input layout.
- **Validation**: Always use Zod schemas for client-side validation.

## Accessibility (WCAG 2.1 AA)

- **Contrast**: All form text, labels, placeholder values, and borders satisfy WCAG 2.1 AA contrast requirements across both dark and light modes.
- **Keyboard Navigation**: Form inputs, buttons, and toggles (such as `FormFieldPassword` eye/eye-off toggle) are fully focusable and operable via `Tab`, `Enter`, and `Space`.
- **ARIA Live & Alert Regions**: Error alerts use `role="alert"` and `aria-live="polite"` so screen readers immediately announce state changes without interrupting user speech.
- **Focus Management**: On validation failure, focus automatically transfers to the first invalid visible input element.

## Responsive Design Standards

Form layouts adapt responsively across standardized Tailwind CSS breakpoints:
- `sm` (640px): Full-width single-column form inputs and stacked CTA actions.
- `md` (768px): Two-column input grids for side-by-side password confirmation fields.
- `lg` (1024px) / `xl` (1280px): Centered modal/card layouts with balanced padding and focus outline indicators.

## Buttons (#754)

There used to be two competing button implementations: `components/common/button.tsx` (a bespoke component hardcoding `bg-[#ffffff]`/`bg-[#222222]`, a fixed 48px height, and no `focus-visible` styling) and `components/ui/button.tsx` (a shadcn/cva button wired to the `--primary`/`--ring` tokens). `components/common/button.tsx` has been removed — `components/ui/button.tsx` is now the only button component and every form should use it directly:

```tsx
import { Button } from "@/components/ui/button";

<Button type="submit" size="lg" className="w-full" disabled={isSubmitDisabled}>
  {isSubmitting ? (
    <>
      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      Saving...
    </>
  ) : (
    "Save"
  )}
</Button>;
```

### Migration notes

- **Prop mapping**: the old component's `text`/`loading` props map to plain children — render the loading label/spinner conditionally instead of passing a `loading` boolean. `width="100%"` maps to `className="w-full"`; the old fixed 48px height maps to `size="lg"` (the closest built-in size token) rather than a hardcoded pixel height.
- **Loading state**: `components/ui/button.tsx` has no built-in `loading` prop by design — compose it explicitly with `lucide-react`'s `Loader2` (see `app/settings/preferences/components/security-tab.tsx` for the established pattern), so the disabled/loading condition stays visible in the calling component instead of being hidden inside the button.
- **Accessibility**: unlike the old component, `components/ui/button.tsx` ships `focus-visible:ring-ring/50` and `focus-visible:ring-[3px]` out of the box, and `disabled:opacity-50 disabled:pointer-events-none` for disabled states — no extra work needed at the callsite for keyboard-focus visibility.
