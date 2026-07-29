"use client";

import { cn } from "@/utils/commonUtils";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  shade?: "light" | "dark";
  animate?: boolean;
}

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
        className,
      )}
      {...props}
    />
  );
}

/**
 * SkeletonLine - single horizontal line primitive for simulating text.
 * Use width to hint at the line length (e.g. "w-3/4", "w-32").
 */
export function SkeletonLine({
  className,
  shade = "dark",
  width,
  ...props
}: SkeletonProps & { width?: string }) {
  return (
    <Skeleton
      shade={shade}
      className={cn("h-4", width ?? "w-full", className)}
      {...props}
    />
  );
}

/**
 * SkeletonText - multi-line text placeholder (backward compatible).
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
            i === lines - 1 && lines > 1 ? "w-3/4" : "w-full",
          )}
        />
      ))}
    </div>
  );
}

/**
 * SkeletonAvatar - circular primitive for avatar / icon placeholders.
 */
export function SkeletonAvatar({
  className,
  shade = "dark",
  size = 40,
  ...props
}: SkeletonProps & { size?: number }) {
  return (
    <Skeleton
      shade={shade}
      className={cn("rounded-full shrink-0", className)}
      style={{ width: size, height: size }}
      {...props}
    />
  );
}

/** @deprecated Use `SkeletonAvatar` instead */
export const SkeletonCircle = SkeletonAvatar;

/**
 * SkeletonRow - horizontal layout combining an optional avatar with text lines.
 *
 * ```
 * [avatar]  [line 1]
 *           [line 2]
 * ```
 */
export function SkeletonRow({
  className,
  shade = "dark",
  avatarSize,
  lines = 1,
  ...props
}: SkeletonProps & { avatarSize?: number; lines?: number }) {
  return (
    <div className={cn("flex items-center gap-3", className)} {...props}>
      {avatarSize !== undefined && (
        <SkeletonAvatar size={avatarSize} shade={shade} />
      )}
      <div className="flex-1 space-y-2">
        {Array.from({ length: lines }).map((_, i) => (
          <Skeleton
            key={i}
            shade={shade}
            className={cn(
              "h-3",
              i === lines - 1 && lines > 1 ? "w-3/4" : "w-full",
            )}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * SkeletonCard - card-shaped container with optional header and content lines.
 */
export function SkeletonCard({
  className,
  shade = "dark",
  showHeader = true,
  lines = 3,
  ...props
}: SkeletonProps & { showHeader?: boolean; lines?: number }) {
  return (
    <div
      className={cn("rounded-xl border border-[#2D2D2D] p-4", className)}
      {...props}
    >
      {showHeader && (
        <div className="mb-4 flex items-center gap-3">
          <SkeletonAvatar size={32} shade={shade} className="rounded-lg" />
          <SkeletonLine shade={shade} width="w-32" />
        </div>
      )}
      <div className="space-y-2">
        {Array.from({ length: lines }).map((_, i) => (
          <SkeletonLine
            key={i}
            shade={shade}
            className={cn(i === lines - 1 ? "w-2/3" : "w-full")}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * SkeletonButton - button-shaped placeholder (backward compatible).
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
