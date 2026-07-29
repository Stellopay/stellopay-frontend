# Form Design System

Standardized form patterns for Stellopay to ensure consistent validation, loading, and feedback states.

## Shared Input Token Contract

All common input components (`TextInput`, `TextareaInput`) now consume design tokens from `components/common/input-tokens.ts`, ensuring pixel-identical visual styling with the canonical shadcn `Input` (`components/ui/input.tsx`).

### Token Definitions

| Token | Export | Description |
|---|---|---|
| Wrapper base | `INPUT_WRAPPER_CLASSES` | Border, radius, shadow, transition, dark mode background |
| Default state | `INPUT_DEFAULT_CLASSES` | Input border + `focus-within` ring on wrapper |
| Error state | `INPUT_ERROR_CLASSES` | Destructive border/ring + destructive focus ring |
| Disabled state | `INPUT_DISABLED_CLASSES` | Reduced opacity, no pointer events, not-allowed cursor |
| Inner element | `INPUT_INNER_CLASSES` | Transparent background, no outline, foreground text, muted placeholder |

### Styling Philosophy

- **Semantic tokens only** — never hardcode colors. Use `--destructive`, `--ring`, `--input`, `--background`, `--foreground`, `--muted-foreground`.
- **`focus-within` on the wrapper** — because the border/ring is painted on the wrapper `<div>` (not the inner `<input>`/`<textarea>`), use `focus-within:` variants rather than `focus-visible:`.
- **`transition-[color,box-shadow]`** — matches the shadcn input transition for smooth state changes.
- **`shadow-xs`** — subtle depth identical to shadcn input.
- **Dark mode** — `dark:bg-input/30` resolves correctly in both themes.

### Interaction States

| State | Visual | Tokens |
|---|---|---|
| **Default** | Neutral border, no ring | `INPUT_DEFAULT_CLASSES` |
| **Hover** | Inherits default (no separate hover token) | — |
| **Focus** | Blue ring (`--ring`) on wrapper | `focus-within:border-ring focus-within:ring-ring/50 focus-within:ring-[3px]` |
| **Error** | Red border + red ring | `INPUT_ERROR_CLASSES` |
| **Error + Focus** | Red border + red focus ring | `focus-within:border-destructive focus-within:ring-destructive/50` (included in `INPUT_ERROR_CLASSES`) |
| **Disabled** | 50% opacity, no pointer events, not-allowed cursor | `INPUT_DISABLED_CLASSES` |

### Accessibility Considerations

- **`aria-invalid`**: Set to `"true"` when in error state; `"false"` otherwise. Screen readers announce invalid state.
- **`aria-describedby`**: Links the input to its helper text and/or error message elements.
- **Error messages**: Rendered with `role="alert"` and `aria-live="polite"` for live region announcement.
- **Disabled state**: Uses `disabled:pointer-events-none` and `disabled:cursor-not-allowed` in addition to opacity.
- **Focus indicators**: Visible focus ring via `focus-within:ring-[3px]` meets WCAG 2.4.7 (Focus Visible).
- **Color contrast**: All foreground/background combinations use semantic tokens that comply with WCAG 2.1 AA (4.5:1 for normal text).

### Guidance for Future Input Components

1. Import tokens from `components/common/input-tokens.ts`.
2. Apply `INPUT_WRAPPER_CLASSES` to the outermost border/ring container.
3. Conditionally apply `INPUT_DEFAULT_CLASSES` or `INPUT_ERROR_CLASSES` based on state.
4. Apply `INPUT_DISABLED_CLASSES` when disabled.
5. Apply `INPUT_INNER_CLASSES` to the inner `<input>`, `<textarea>`, or `<select>` element.
6. Use `focus-within:` variants on the wrapper for focus ring (the inner element uses `focus:outline-none`).

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

### 2. TextInput (Common)

Common text input used across the application. Uses the shared input token contract.

### 3. TextareaInput (Common)

Common textarea input with character counter support. Uses the shared input token contract.

### 4. FormField (Abstractions)

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

## Security

- **No Console Logs**: Ensure `onSubmit` handlers do not log raw form data in production.
- **Auto-complete**: Use appropriate `autoComplete` values (e.g., `new-password`, `current-password`, `email`).
- **Validation**: Always use Zod schemas for client-side validation.

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
