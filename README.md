This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

```
stellopay-frontend
├─ .eslintrc.json
├─ .hintrc
├─ app
│  ├─ account-summary
│  │  └─ page.tsx
│  ├─ components
│  │  ├─ Button.tsx
│  │  ├─ EmailInput.tsx
│  │  ├─ FaqCard.tsx
│  │  ├─ TextAreaInput.tsx
│  │  ├─ TextInput.tsx
│  │  └─ ToggleCard.tsx
│  ├─ favicon.ico
│  ├─ globals.css
│  ├─ help
│  │  └─ support
│  │     └─ page.tsx
│  ├─ layout.tsx
│  ├─ page.tsx
│  └─ settings
│     ├─ preferences
│     │  ├─ components
│     │  │  └─ SecurityTab.tsx
│     │  ├─ Image.png
│     │  └─ page.tsx
│     └─ profile
│        ├─ components
│        │  └─ ProfileTab.tsx
│        └─ page.tsx
├─ components
│  ├─ icons
│  │  └─ BellFillIcon.tsx
│  ├─ NotificationPanel.tsx
│  └─ ui
│     └─ button.tsx
├─ components.json
├─ design
│  └─ figma-design.txt
├─ lib
│  └─ utils.ts
├─ next.config.ts
├─ package-lock.json
├─ package.json
├─ postcss.config.mjs
├─ public
│  ├─ bank.png
│  ├─ file.svg
│  ├─ globe.svg
│  ├─ Icon.png
│  ├─ next.svg
│  ├─ piggy-bank.png
│  ├─ vercel.svg
│  └─ window.svg
├─ README.md
├─ tsconfig.json
└─ types
   └─ NotificationItem.tsx
```

## Design Resources

- **Main Figma Design Workspace**: See [design/figma-design.txt](design/figma-design.txt) for all page-specific layouts (Dashboard, Settings, Help/Support, etc.)
- **Landing Page Redesign Figma Link**: [Figma Link](https://www.figma.com/design/J4X2XvMo8knspQEEQbHoDN/Stellopay-Landing-page?node-id=0-1&t=edynl8rBO0dXUrXp-1)

## Theme System & Dark Mode

The application uses a context-based theme system with Tailwind CSS and local storage persistence.

### Architecture & Usage
The context provider is configured in `context/theme-context.tsx` and wraps the root layout in `app/layout.tsx`.

You can access and toggle the theme programmatically in components using the custom hook:

```tsx
import { useTheme } from "@/context/theme-context";

export default function MyComponent() {
  const { theme, toggleTheme, setTheme } = useTheme();
  
  // Access current theme ("light" or "dark")
  console.log(theme);
  
  // Toggle between light and dark themes
  return <button onClick={toggleTheme}>Toggle Theme</button>;
}
```

- **Theme Toggle UI**: Located in the top-right corner within `components/landing/navbar.tsx`.
- **System Preference**: Falls back to the system's preferred color scheme if no preference is stored in `localStorage`.
- **Tailwind Integration**: Utilizes Tailwind's native `dark:` modifier (e.g. `bg-white dark:bg-zinc-900`) for styling.

