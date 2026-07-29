# Help & Support Redesign - Ticket Status Tracker Widget

**Issue:** #915 - Add support-ticket status tracker widget  
**Date:** July 2026  
**Component:** `components/help-support/ticket-status-widget.tsx`  
**Integration Point:** `app/help/support/page.tsx`

## Overview

Added a support ticket status tracker widget to the `/help/support` page that allows users to check on the status of their submitted support requests. Previously, users had no way to track tickets without emailing support again.

## Problem Statement

**Before:** Users submit a support ticket via the Contact Support form but have no visibility into:
- Whether their ticket was received
- Current status (open/in-progress/resolved)
- When it was last updated
- What category it was filed under

**Result:** Poor user experience and increased support burden as users resubmit tickets thinking they weren't received.

## Solution

A prominent status tracker widget positioned at the top of the help/support page showing:
1. All submitted tickets with status badges
2. Ticket ID and category for easy reference
3. Most recent status update timestamp
4. Clear empty state for new users
5. Status legend explaining badge meanings

## Design Details

### Layout

**Desktop (≥ 768px):**
```
┌─────────────────────────────────────────────────────┐
│  Your Support Tickets                               │
│  Track the status of your 3 submitted requests       │
├─────────────────────────────────────────────────────┤
│ TKT-001 [Payment & Transfers]                        │
│ Transfer failed with error 502        [Resolved] 2d │
├─────────────────────────────────────────────────────┤
│ TKT-002 [Account Management]                         │
│ Unable to update profile picture    [In Progress] 6h │
├─────────────────────────────────────────────────────┤
│ TKT-003 [Security & Privacy]                         │
│ Suspicious login attempt                 [Open] 4h  │
└─────────────────────────────────────────────────────┘

Status Legend
[Open]         Awaiting response
[In Progress]  Being worked on
[Resolved]     Issue closed
```

**Mobile (< 768px):**
```
┌────────────────────────────┐
│ Your Support Tickets       │
│ Track 3 submitted requests │
├────────────────────────────┤
│ TKT-001 [Payment & ...]    │
│ Transfer failed...         │
│ [Resolved] ⏱ 2 days ago   │
├────────────────────────────┤
│ TKT-002 [Account Mgmt]     │
│ Unable to update...        │
│ [In Progress] ⏱ 6h ago    │
└────────────────────────────┘
```

### Component Hierarchy

```
TicketStatusWidget (container)
├── Card (border + background)
│   ├── CardHeader
│   │   ├── CardTitle: "Your Support Tickets"
│   │   └── CardDescription: Ticket count
│   └── CardContent
│       ├── Empty State (when tickets.length === 0)
│       │   ├── AlertCircle icon
│       │   ├── "No support tickets yet"
│       │   └── Helpful guidance text
│       ├── Loading State (when isLoading === true)
│       │   └── Skeleton loaders (2)
│       └── Tickets List (role="list")
│           ├── TicketRow (role="listitem") ×N
│           │   ├── Ticket ID + Category badge
│           │   ├── Subject (truncated to 2 lines)
│           │   ├── Status badge (open/in-progress/resolved)
│           │   └── Last updated timestamp
│           └── Status Legend
│               └── 3 status type explanations
```

### Color Scheme

**Status Badge Colors** (WCAG AA compliant):

| Status | Background | Text | Icon | Usage |
|--------|-----------|------|------|-------|
| Open | `#191919` | `#FBBF24` (Amber) | AlertCircle | Awaiting first response |
| In Progress | `#1A1A1A` | `#60A5FA` (Blue) | Zap | Actively being worked |
| Resolved | `#102B19` | `#34D399` (Green) | CheckCircle2 | Issue closed |

**Card Styling:**
- Light: `bg-white/90 border-zinc-200`
- Dark: `bg-white/5 border-white/10`
- Hover: `bg-white/70` (light) / `bg-white/10` (dark)

### Typography

- **Widget Title:** `font-general text-xl font-semibold`
- **Ticket Subject:** `text-sm font-medium` (truncated to 2 lines)
- **Ticket ID:** `font-mono text-xs` (monospace for clarity)
- **Category:** Using Badge component with outline variant
- **Status Badge:** `text-xs font-medium capitalize`
- **Timestamp:** `text-xs text-zinc-600 dark:text-zinc-400`

### Spacing

- **Widget container:** Card with standard padding (CardContent handles it)
- **Ticket rows:** `space-y-3` (gap between rows)
- **Individual row padding:** `p-4` (consistent with other support UI)
- **Row gaps:** `gap-3 sm:gap-4` (responsive gap for mobile)
- **Legend separator:** `mt-6 pt-4 border-t`

## Accessibility (WCAG 2.1 AA)

### Keyboard Navigation ✅
- Tab through widget to focus next element
- Tab through tickets to read each one
- Status badge is focusable with visible focus ring
- All interactive elements are reachable via keyboard

### Screen Reader Support ✅
- `role="list"` on container with `aria-label="Support tickets list"`
- `role="listitem"` on each ticket row
- `aria-label` on status badges: "Status: open", "Status: in progress"
- `<time>` elements with `dateTime` attributes for timestamp accessibility
- Semantic HTML (`<time>`, `<h2>`) for structure
- Empty state provides clear guidance text
- Descriptive headings and descriptions

### Color & Contrast ✅
- Status badge colors meet 4.5:1 minimum contrast ratio (AA)
- Text on cards meets 4.5:1 contrast (light: #09090B on white; dark: white on #09090B)
- Icons accompany text (not relying on color alone)

### Focus Management ✅
- Focus indicators visible on all interactive elements
- Natural tab order (top to bottom)
- No focus traps

### Responsive Accessibility ✅
- Layout adapts to smaller screens without losing functionality
- Touch targets are minimum 44×44px on mobile
- Horizontal scrolling not required

## Responsive Behavior

### Breakpoints Tested

| Breakpoint | Device | Width | Status |
|-----------|--------|-------|--------|
| sm | Mobile | 640px | ✅ Compact stacked layout |
| md | Tablet | 768px | ✅ Side-by-side layout begins |
| lg | Large tablet | 1024px | ✅ Full width with breathing room |
| xl | Desktop | 1280px | ✅ Optimized spacing |

### Mobile-First Classes

- **Ticket row layout:** `flex flex-col sm:flex-row` (stacked → side-by-side)
- **Gap sizing:** `gap-3 sm:gap-4` (tighter → relaxed spacing)
- **Badge alignment:** `items-start sm:items-center` (align-start → center)
- **Subject truncation:** `line-clamp-2` (consistent across all sizes)
- **Grid in legend:** `grid-cols-1 sm:grid-cols-3` (stacked → 3-column)

### Testing Performed

✅ Mobile (390×844): Compact, single-column, touch-friendly  
✅ Tablet (768×1024): Two-column awareness, readable text  
✅ Desktop (1280×720): Optimal spacing, full features visible  
✅ Landscape modes tested  
✅ Dark mode rendering verified

## Dark Mode Support

All components render correctly in both light and dark modes:

- Card: `dark:bg-white/5 dark:border-white/10`
- Text: `dark:text-white` / `dark:text-zinc-400`
- Hover states: `dark:hover:bg-white/10`
- Status badges: Colors maintained (amber/blue/green)
- Icons: SVG icons inherit text color

**Dark Mode Testing:** ✅ Verified in browser DevTools emulation

## Mock Data

**File:** `lib/demo-data-support.ts`

Provides 3 demo tickets covering all states:
1. **Resolved** (7 days ago, updated 2 days ago) - Payment & Transfers
2. **In Progress** (3 days ago, updated 6 hours ago) - Account Management
3. **Open** (4 hours ago, just submitted) - Security & Privacy

All tickets include realistic content:
- Ticket IDs (TKT-YYYY-NNN format)
- Subject lines that describe the issue
- Full message content
- Timestamps (ISO format)
- User information (name, email)

## Data Structure

**Type:** `SupportTicket` (types/support.ts)

```typescript
interface SupportTicket {
  id: string;                    // "TKT-2024-001"
  category: string;              // "Payment & Transfers"
  subject: string;               // "Transfer failed with error code 502"
  message: string;               // Full message content
  status: SupportTicketStatus;   // "open" | "in-progress" | "resolved"
  submittedAt: string;           // ISO timestamp
  lastUpdatedAt: string;         // ISO timestamp
  firstName: string;             // "Chioma"
  lastName: string;              // "Okonkwo"
  email: string;                 // "chioma.okonkwo@example.com"
}
```

## Testing

### Test Files

1. **`app/help/support/page.test.tsx`** - Integration tests
   - Ticket widget rendering
   - Demo data loading
   - Tab navigation
   - FAQ card rendering
   - Layout structure

2. **`components/help-support/ticket-status-widget.test.tsx`** - Component tests
   - Ticket display (ID, category, subject)
   - Status badge rendering
   - Empty state
   - Loading state
   - Timestamp formatting
   - Accessibility (ARIA, semantic HTML)
   - Responsive layout classes
   - Dark mode classes
   - Long text truncation
   - Singular/plural messaging

### Test Coverage

**Unit Tests:** ✅ 40+ test cases covering:
- Component rendering
- Data display
- Status states
- Empty/loading states
- Accessibility attributes
- Responsive classes
- Dark mode
- Edge cases (long text, etc.)

**All tests passing:** ✅ `npm run test`

## Performance Considerations

- **No external API calls** during development (uses mock data)
- **Lightweight component** (~150 LOC)
- **Efficient rendering:** Only re-renders on prop changes
- **Minimal DOM nodes:** Uses semantic HTML structure
- **Optimized for mobile:** Responsive classes reduce re-layout

## Future Enhancements

1. **Live API Integration**
   - Replace mock data with real API calls
   - Implement useEffect with auth token

2. **Ticket Details Modal**
   - Click ticket to open full details
   - Show message thread/updates

3. **Status Filtering**
   - Filter by status (Show only: Open, In Progress, Resolved)

4. **Refresh Button**
   - Manual refresh with loading state
   - Auto-refresh every 60 seconds

5. **Search/Sort**
   - Sort by date, status, category
   - Search by ticket ID or subject

6. **Pagination**
   - Handle large ticket lists (20+)
   - Lazy load additional tickets

## Browser Support

- ✅ Chrome/Edge (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)

**Tested with:**
- Chromium 126+
- Firefox 127+
- Safari 17+

## Accessibility Audit

- ✅ axe-core scanning (no violations)
- ✅ Keyboard navigation testing
- ✅ Screen reader testing (NVDA, JAWS simulation)
- ✅ Color contrast verification
- ✅ Focus indicator visibility
- ✅ Semantic HTML structure

**WCAG 2.1 AA Compliance:** ✅ Fully compliant

## Before/After Comparison

### Before
- Help/Support page showed only FAQ and contact form
- No way to track submitted tickets
- Users had to email again to check status
- No feedback loop for support submissions

### After
- Widget prominently displayed at top of help/support page
- All submitted tickets visible with current status
- Timestamps show when ticket was last updated
- Clear status legend explains what each badge means
- Empty state guides new users
- Responsive design works on all device sizes
- Fully accessible (WCAG 2.1 AA)

## Commit Message

```
feat: add support-ticket status tracker widget (#915)

Add ticket status widget to /help/support page enabling users to track
submitted support requests. Widget displays ticket ID, category, subject,
current status (open/in-progress/resolved), and last update timestamp.

FEATURES:
- Ticket status tracking with visual badges
- Status legend explaining badge meanings
- Empty state for new users
- Responsive design (mobile to desktop)
- Dark mode support
- Full WCAG 2.1 AA accessibility

IMPLEMENTATION:
- New component: components/help-support/ticket-status-widget.tsx
- New type: types/support.ts
- New mock data: lib/demo-data-support.ts
- Updated: app/help/support/page.tsx
- Tests: app/help/support/page.test.tsx, ticket-status-widget.test.tsx

TESTING:
✅ 40+ unit tests covering all scenarios
✅ Responsive behavior verified across breakpoints
✅ Dark mode rendering tested
✅ Accessibility compliance verified
✅ All browsers supported

Fixes #915
```

## Files Changed Summary

| File | Type | Changes |
|------|------|---------|
| `components/help-support/ticket-status-widget.tsx` | NEW | 350 LOC - Main widget component |
| `types/support.ts` | NEW | 25 LOC - SupportTicket type definition |
| `lib/demo-data-support.ts` | NEW | 55 LOC - Mock ticket data |
| `app/help/support/page.tsx` | MODIFIED | +10 LOC - Widget integration |
| `app/help/support/page.test.tsx` | NEW | 150 LOC - Integration tests |
| `components/help-support/ticket-status-widget.test.tsx` | NEW | 380 LOC - Component tests |
| `design/help-support-redesign.md` | NEW | This file - Design documentation |

**Total New Code:** ~970 lines  
**Total Test Code:** ~530 lines

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

## Global Floating Feedback Widget

**Issue:** #917  
**Status:** Implemented  
**Type:** Frontend Feature

### Overview

A global floating feedback widget has been added to provide users with a quick way to report bugs and suggest features from any authenticated page.

### Features

- Floating feedback button (bottom-right corner) on all authenticated pages
- Modal dialog with two feedback types: Bug Report and Feature Request
- Form fields: Subject and Description (with client-side Zod validation)
- Optional screenshot upload (PNG, JPEG, WebP, GIF; max 10 MB)
- Integration with the existing Help/Support API endpoint (`POST /api/support`)
- Success and error feedback messages
- Auto-close after successful submission

### Accessibility

- WCAG 2.1 AA compliant
- Keyboard accessible (Enter/Space to open, Escape to close, Tab to navigate)
- ARIA labels on all interactive elements
- `role="dialog"`, `aria-modal`, `aria-labelledby`, `aria-describedby` on the modal
- Screen reader live region for status announcements

### Responsive Design

- Mobile-friendly with full-width form elements
- Responsive max-width (`sm:max-w-[500px]`)
- Body scroll lock when modal is open

### Dark Mode

- Uses CSS variable classes (`bg-background`, `text-foreground`, `border-border`, etc.)
- Automatically adapts to the application's dark mode theme

### Files Changed

- `components/common/feedback-widget.tsx` — New component (inline modal)
- `components/common/app-layout.tsx` — Integrated FeedbackWidget
- `components/common/app-layout.test.tsx` — Comprehensive tests (22 tests)

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
