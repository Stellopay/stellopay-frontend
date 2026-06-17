# Pull Request: Footer Redesign

## Description

This PR introduces a comprehensive redesign of the footer component to match the new design specifications. The footer has been transformed from a minimal navigation bar into a full-featured, modern footer with multiple sections.

### Changes Made:

- **Logo & Brand Section**: Added StelloPay logo (using `stellopay-icon.svg` from public folder) with brand name and company description
- **Navigation Columns**: Implemented 4 organized link columns:
  - **Product**: Features, Pricing, Security, API, Integrations
  - **Company**: About, Blog, Careers, Press, Partners
  - **Resources**: Documentation, Help Center, Tutorials, Community, Error Pages
  - **Legal**: Privacy, Terms, Cookie Policy, Licenses
- **Social Media Links**: Added circular icon buttons for Twitter, LinkedIn, GitHub, and Email with hover effects
- **Newsletter Subscription**: Centered section with:
  - Heading: "Stay updated with StelloPay"
  - Description text
  - Email input field with validation
  - Subscribe button with loading state
- **Bottom Bar**: Copyright notice and legal links (Privacy Policy, Terms of Service, Cookie Policy)

### Technical Improvements:

- Fully responsive grid layout (mobile-first with breakpoints for md and lg screens)
- Smooth hover transitions on all interactive elements
- Purple accent color (`#7C3AED`) for brand consistency
- Custom SVG icon components for social media
- Form handling with loading state for newsletter subscription

## Related Issue

N/A

## Checklist

- [x] I have tested the changes locally.
- [x] I have added/updated documentation as needed.
- [x] I have reviewed the code and ensured it follows the project guidelines.
- [ ] I have added necessary tests.

## Screenshots/Recordings

### New Footer Design

*(Please refer to the design mockup for reference, or run the app locally to view the updated footer).*


### Design Reference

The footer was redesigned to match the provided design mockup, featuring:

| Section | Description |
|---------|-------------|
| Logo & Description | StelloPay branding with company tagline |
| Navigation | 4 columns: Product, Company, Resources, Legal |
| Social Icons | Twitter, LinkedIn, GitHub, Email |
| Newsletter | Email subscription form with CTA button |
| Bottom Bar | Copyright + legal links |

## Files Changed

| File | Changes |
|------|---------|
| `components/common/footer.tsx` | Complete redesign with new layout, components, and styling |

## Additional Notes

- The footer uses the `stellopay-icon.svg` logo from the `/public` folder
- The design is fully responsive and adapts to mobile, tablet, and desktop viewports
- Hover states have been implemented for all interactive elements with smooth transitions
- The newsletter form includes a simulated API call with loading state (to be connected to actual backend)
- Font family is set to "General Sans" to maintain consistency with the rest of the application
