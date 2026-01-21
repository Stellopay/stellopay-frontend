"use client";

import { cn } from "@/utils/commonUtils";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * The shade variant of the skeleton
   * - light: For lighter backgrounds (#3A3A3A base with lighter shimmer)
   * - dark: For darker backgrounds (#2D2D2D base with lighter shimmer)
   */
  shade?: "light" | "dark";
  /**
   * Whether to show the shimmer animation
   */
  animate?: boolean;
}

/**
 * Skeleton loading component with shimmer animation
 * Matches the Figma design system with light/dark variants
 */
export function Skeleton({
  className,
  shade = "dark",
  animate = true,
  ...props
}: SkeletonProps) {
  const baseColors = {
    light: "bg-[#3A3A3A]",
    dark: "bg-[#2D2D2D]",
  };

  return (
    <div
      className={cn(
        "rounded-md",
        baseColors[shade],
        animate && "skeleton-shimmer",
        className
      )}
      {...props}
    />
  );
}

/**
 * Skeleton text line - for simulating text content
 */
export function SkeletonText({
  className,
  shade = "dark",
  lines = 1,
  ...props
}: SkeletonProps & { lines?: number }) {
  return (
    <div className={cn("space-y-2", className)} {...props}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          shade={shade}
          className={cn(
            "h-3",
            i === lines - 1 && lines > 1 ? "w-3/4" : "w-full"
          )}
        />
      ))}
    </div>
  );
}

/**
 * Skeleton circle - for avatars and icons
 */
export function SkeletonCircle({
  className,
  shade = "dark",
  size = 40,
  ...props
}: SkeletonProps & { size?: number }) {
  return (
    <Skeleton
      shade={shade}
      className={cn("rounded-full", className)}
      style={{ width: size, height: size }}
      {...props}
    />
  );
}

/**
 * Skeleton button - for button placeholders
 */
export function SkeletonButton({
  className,
  shade = "dark",
  ...props
}: SkeletonProps) {
  return (
    <Skeleton
      shade={shade}
      className={cn("h-9 w-24 rounded-lg", className)}
      {...props}
    />
  );
}

export default Skeleton;
