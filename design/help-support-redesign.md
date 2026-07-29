# Help / Support Page Redesign

**Issue:** #156  
**Status:** Completed  
**Type:** Design Only

---

## Overview

This submission delivers a modern, user-friendly redesign of the **StelloPay Help & Support page**.  
The design prioritizes clarity, accessibility, and fast problem resolution, while remaining fully responsive across mobile, tablet, and desktop devices.

The goal was to help users **find answers quickly**, reduce support friction, and create a calm, trustworthy support experience.

---

## Design Approach

The design approach focused on:

- Search-first support experience to surface answers instantly
- Clear information hierarchy using cards, tabs, and grouped sections
- Action-oriented UI that guides users to the right support channel
- Mobile-first responsiveness, scaled cleanly to tablet and desktop
- Accessible, calm fintech styling to reduce user anxiety

Where possible, issues can be resolved through FAQs and guides before escalating to support tickets.

---

## Figma Design File

**Figma:** [View Complete Design on Figma](https://www.figma.com/design/Ntcbc8bESxTjkb0bT4ilLW/Stellopay---Help-Support-Page-Redesign?node-id=26-2352&t=CPUyDeLZZiDXFXJv-1)

---

---

## Component Specifications

### 1. Support Navigation / Tabs

- **Description:** Sticky navigation tabs for quick access to FAQs, account help, tickets, and contact options
- **States:** Default, Active, Hover
- **Responsive behavior:** Collapses into icon-based navigation on mobile

---

### 2. FAQ Section

- **Description:** Card-based, expandable FAQ items grouped by category
- **Expandable items:** Yes
- **Search integration:** Yes
- **Categories:**
  - Getting Started
  - Payments & Transfers
  - Account & Verification
  - Security & Privacy

---

### 3. Support Ticket System

- **Description:** Guided ticket creation with helper tips and confirmation states
- **Form fields:**
  - Issue category
  - Subject
  - Description
  - Attachments
  - Priority level
- **Priority levels:** Low, Medium, Urgent
- **Status indicators:** Open, Pending, In Review, Resolved

---

### 4. Account Management Help

- **Description:** Self-service account assistance using action cards
- **Key sections:**
  - Verify account
  - Reset or change password
  - Enable two-factor authentication (2FA)
  - Update profile
  - Security and privacy settings
  - Close or deactivate account

---

### 5. Contact & Support Options

- **Description:** Clear support channels with response expectations
- **Contact channels:**
  - Live chat
  - Email support
  - Community support
  - Emergency support (highlighted)
- **Response time:** Clearly communicated per channel

---

### 6. Search Functionality

- **Description:** Centralized search for help articles and FAQs
- **Search scope:** FAQs, guides, and help content

---

## Design Features

### Accessibility

- WCAG-compliant color contrast
- Readable typography and spacing
- Large tap targets for mobile
- Clear focus and error states

### Responsive Design

- **Mobile:** < 430px
- **Tablet:** 1024px
- **Desktop:** > 1512px

### Design System

- **Typography:** Geist font and Inter fonts family
- **Color Palette:** #598EFF, neutral backgrounds - #CDDDFF ,
- **Spacing:** Consistent 8-48px based scale
- **Border Radius:** 8–32px for cards and components

---

## Key Design Decisions

1. Search-first layout to reduce time spent browsing help content
2. Card-based components to improve scannability and mobile usability
3. Clear separation between self-help and escalation paths to reduce support load

---

## Implementation Notes

- Figma components organized for easy developer handoff
- Responsive breakpoints clearly defined
- Interactive states documented
- Styles aligned with StelloPay’s existing design language

---

## Next Steps

Frontend implementation can reference the Figma file for:

- Component behavior
- Responsive layouts
- Interactive states
- Asset exports

---

## Design Assets

**Figma File:** [\[Link to Figma\]](https://www.figma.com/design/Ntcbc8bESxTjkb0bT4ilLW/Stellopay---Help-Support-Page-Redesign?node-id=0-1&t=CPUyDeLZZiDXFXJv-1)  
**Last Updated:** January 29, 2026

---

## 7. Persistent Back Affordance (Account Management Sub-page)

- **Description:** A persistent "Back to Help Center" link at the top of sub-pages so users who land from search can navigate back without relying on the browser back button.
- **Location:** `app/help/support/accountManagement/page.tsx` — rendered as the first interactive element inside the page wrapper.

### Behavior

- Always visible at the top of the page (never scrolls out of view for typical content heights).
- Uses an `ArrowLeft` icon + "Back to Help Center" text.
- Links to `/help/support`.
- Complements the breadcrumb navigation rendered by `SupportTabs` (which shows the full "Help/Support &gt; Account Management" hierarchy).

### Accessibility (WCAG 2.1 AA)

- Link has `aria-label="Back to Help Center"`.
- Arrow icon is marked `aria-hidden="true"`.
- Link is the first focusable element after the skip-to-content link.
- `nav[aria-label="Breadcrumb"]` landmark wraps the breadcrumb in `SupportTabs`, with `aria-current="page"` on the current page label.
- Color `#A0A0A0` on `#0f0711` background provides ~5.5:1 contrast ratio (passes WCAG AA for both normal and large text).
- Hover state transitions to `text-white` for clear focus/hover feedback.

### Loading State

- `loading.tsx` renders a skeleton that mirrors the page layout: back link placeholder, breadcrumb placeholder, tab skeletons, sidebar, and content area.
- Includes `role="status"`, `aria-busy="true"`, `aria-live="polite"`, and an `sr-only` announcement.

### Responsive Behavior

| Breakpoint | Behavior |
|---|---|
| sm (640px) | Back link and breadcrumb stack naturally; padding adjusts to `p-4` / `p-6` |
| md (768px) | Layout transitions from stacked to side-by-side sidebar + content |
| lg (1024px) | Full two-column layout |
| xl (1280px) | Same as lg, wider container |

### Testing

- **File:** `app/help/support/accountManagement/loading.test.tsx`
- Validates accessible status region, sr-only label, and axe accessibility violations.
- Run with `pnpm test`.
