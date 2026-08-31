"use client";

import React, { useState } from "react";
import Image, { ImageProps } from "next/image";
import {
  ImageCategory,
  IMAGE_BUDGETS,
  getAccessibleImageProps,
  resolveImageLoadingProps,
} from "@/lib/image-budget";
import { cn } from "@/utils/commonUtils";

export interface AppImageProps extends Omit<ImageProps, "alt"> {
  /** Explicit alt text for informative images */
  alt?: string;
  /** Whether the image is purely decorative and should be hidden from AT */
  isDecorative?: boolean;
  /** Image budget category to populate sensible default dimensions and sizes */
  category?: ImageCategory;
  /** Viewport placement for priority and lazy loading configuration */
  placement?: "above-the-fold" | "below-the-fold" | "lcp" | "lazy";
  /** Optional skeleton placeholder style while loading */
  showSkeleton?: boolean;
  /** Container className for layout reservation */
  containerClassName?: string;
}

/**
 * AppImage — Canonical Next.js image wrapper enforcing image budgets,
 * CLS avoidance, and strict accessibility rules.
 */
export function AppImage({
  src,
  alt,
  isDecorative = false,
  category,
  placement = "below-the-fold",
  width,
  height,
  sizes,
  className,
  priority,
  loading,
  showSkeleton = false,
  containerClassName,
  ...rest
}: AppImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);

  const budget = category ? IMAGE_BUDGETS[category] : undefined;
  const resolvedWidth = width ?? budget?.defaultWidth;
  const resolvedHeight = height ?? budget?.defaultHeight;
  const resolvedSizes = sizes ?? budget?.sizes;

  const loadingProps = resolveImageLoadingProps(
    priority ? "above-the-fold" : placement,
  );
  const a11yProps = getAccessibleImageProps({
    alt,
    isDecorative,
  });

  const finalPriority = priority !== undefined ? priority : loadingProps.priority;
  const finalLoading = finalPriority ? undefined : (loading ?? loadingProps.loading);

  const imageElement = (
    <Image
      src={src}
      {...a11yProps}
      width={resolvedWidth}
      height={resolvedHeight}
      sizes={resolvedSizes}
      priority={finalPriority}
      loading={finalLoading}
      className={cn(
        "transition-opacity duration-200",
        showSkeleton && !isLoaded ? "opacity-0" : "opacity-100",
        className,
      )}
      onLoad={(e) => {
        setIsLoaded(true);
        rest.onLoad?.(e);
      }}
      {...rest}
    />
  );

  if (showSkeleton) {
    return (
      <div
        className={cn(
          "relative overflow-hidden bg-muted/40",
          !isLoaded && "animate-pulse",
          containerClassName,
        )}
        style={{
          width: resolvedWidth ? `${resolvedWidth}px` : undefined,
          height: resolvedHeight ? `${resolvedHeight}px` : undefined,
        }}
      >
        {imageElement}
      </div>
    );
  }

  return imageElement;
}

export default AppImage;
