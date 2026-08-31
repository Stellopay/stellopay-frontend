/**
 * Module declarations for static image assets.
 *
 * Next.js handles these imports at build time via its webpack config, but
 * TypeScript needs explicit declarations so `tsc --noEmit` doesn't report
 * TS2307 "Cannot find module" errors for image imports.
 */
declare module "*.png" {
  import { StaticImageData } from "next/image";
  const content: StaticImageData;
  export default content;
}

declare module "*.jpg" {
  import { StaticImageData } from "next/image";
  const content: StaticImageData;
  export default content;
}

declare module "*.jpeg" {
  import { StaticImageData } from "next/image";
  const content: StaticImageData;
  export default content;
}

declare module "*.gif" {
  import { StaticImageData } from "next/image";
  const content: StaticImageData;
  export default content;
}

declare module "*.webp" {
  import { StaticImageData } from "next/image";
  const content: StaticImageData;
  export default content;
}

declare module "*.svg" {
  import { StaticImageData } from "next/image";
  const content: StaticImageData;
  export default content;
}

/**
 * Plain (non-CSS-module) stylesheet side-effect imports, e.g. `./globals.css`.
 * Next.js loads these via webpack at build time; TypeScript just needs to
 * know the specifier resolves to something so it doesn't report TS2307.
 */
declare module "*.css";
