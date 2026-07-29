# Typography System: Line-Height & Letter-Spacing Scale (#764)

This document specifies the tokenized typographic scale mapping for the **Clash Display**, **General Sans**, and **Inter** font family stacks across StelloPay landing and dashboard surfaces.

## Typography Scale Matrix

| Role | Utility Class | Font Family | Size | Line Height (Leading) | Letter Spacing (Tracking) | Usage Surface |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Display 2XL** | `.text-display-2xl` | Clash Display | 72px (`4.5rem`) | 1.05 | `-0.03em` | Hero main headlines |
| **Display XL** | `.text-display-xl` | Clash Display | 60px (`3.75rem`) | 1.1 | `-0.025em` | Major section headers |
| **Heading LG** | `.text-heading-lg` | Clash Display | 36px (`2.25rem`) | 1.2 | `-0.02em` | Dashboard section titles |
| **Heading MD** | `.text-heading-md` | Clash Display | 24px (`1.5rem`) | 1.25 | `-0.015em` | Card & modal titles |
| **Body LG** | `.text-body-lg` | General Sans / Inter | 18px (`1.125rem`) | 1.6 | `-0.01em` | Lead paragraphs |
| **Body MD** | `.text-body-md` | General Sans / Inter | 16px (`1rem`) | 1.5 | `0em` | Standard interface copy |
| **Caption SM** | `.text-caption-sm` | Inter | 14px (`0.875rem`) | 1.43 | `+0.01em` | Table headers & captions |

## Accessibility & Guidelines
- **WCAG 2.1 AA Compliance:** Minimum relative line-height threshold of `1.4` enforced across all body and caption copy to ensure reading legibility.
- **Responsive Behavior:** Scale scales down proportionally at `< sm` (`640px`) breakpoints using responsive utility overrides.
