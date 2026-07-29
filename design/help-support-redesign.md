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

## Technical Enhancements

### Account Management Loading Skeleton
To prevent layout shift and visible reflows, a loading skeleton was added for the `accountManagement` section (`app/help/support/accountManagement/loading.tsx`).
- **Structural Parity:** Mirrors the precise flexbox layout, padding, heading styles, and paragraph layouts of the real article content (`page.tsx`).
- **Accessibility:** 
  - Integrates ARIA attributes (`aria-busy="true"`, `aria-live="polite"`, `aria-label`) to ensure assistive technologies can parse the loading state seamlessly.
  - Interactive elements (like the search bar) are appropriately marked as disabled.
- **Dark/Light Modes:** The skeleton component inherently supports both light and dark variations depending on the current token context (e.g. `shade="light"` for active tabs).
- **Responsive Validated:** Tested across sm (640), md (768), lg (1024), and xl (1280) breakpoints.
