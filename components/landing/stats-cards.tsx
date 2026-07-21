"use client";

import { FC, useEffect, useMemo, useRef, useState } from "react";
import type { StatCardItem } from "@/types/landing";

export interface StatsCardsProps {
  stats: StatCardItem[];
}

const ANIMATION_DURATION_MS = 1_500;

interface ParsedStatValue {
  decimalPlaces: number;
  prefix: string;
  suffix: string;
  target: number;
}

function parseStatValue(value: string): ParsedStatValue | null {
  const match = value.match(/^(.*?)(-?[\d,]+(?:\.\d+)?)(.*)$/);

  if (!match) return null;

  const [, prefix, numericValue, suffix] = match;
  const decimalPlaces = numericValue.includes(".")
    ? numericValue.split(".")[1].length
    : 0;

  return {
    decimalPlaces,
    prefix,
    suffix,
    target: Number(numericValue.replaceAll(",", "")),
  };
}

function formatStatValue(
  originalValue: string,
  parsedValue: ParsedStatValue | null,
  progress: number,
): string {
  if (!parsedValue) return originalValue;

  const { decimalPlaces, prefix, suffix, target } = parsedValue;
  const currentValue = target * progress;
  const formattedNumber =
    decimalPlaces > 0
      ? currentValue.toFixed(decimalPlaces)
      : Math.round(currentValue).toLocaleString("en-US");

  return `${prefix}${formattedNumber}${suffix}`;
}

export const StatsCards: FC<StatsCardsProps> = ({ stats }) => {
  const sectionRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const hasAnimatedRef = useRef(false);
  const [progress, setProgress] = useState(0);
  const parsedStats = useMemo(
    () => stats.map(({ value }) => parseStatValue(value)),
    [stats],
  );

  useEffect(() => {
    const prefersReducedMotion =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReducedMotion) {
      hasAnimatedRef.current = true;
      setProgress(1);
      return;
    }

    const startAnimation = () => {
      if (hasAnimatedRef.current) return;

      hasAnimatedRef.current = true;
      let startTime: number | null = null;

      const animate = (timestamp: number) => {
        if (startTime === null) startTime = timestamp;

        const elapsed = timestamp - startTime;
        const linearProgress = Math.min(elapsed / ANIMATION_DURATION_MS, 1);
        const easedProgress = 1 - Math.pow(1 - linearProgress, 3);
        setProgress(easedProgress);

        if (linearProgress < 1) {
          animationFrameRef.current = window.requestAnimationFrame(animate);
        }
      };

      animationFrameRef.current = window.requestAnimationFrame(animate);
    };

    if (typeof window.IntersectionObserver !== "function") {
      startAnimation();
      return () => {
        // startAnimation schedules a frame synchronously in this fallback.
        window.cancelAnimationFrame(animationFrameRef.current!);
      };
    }

    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        observer.disconnect();
        startAnimation();
      }
    });

    if (sectionRef.current) observer.observe(sectionRef.current);

    return () => {
      observer.disconnect();
      if (animationFrameRef.current !== null) {
        window.cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  return (
    <div
      ref={sectionRef}
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 w-full"
    >
      {stats.map((item, index) => (
        <div
          key={index}
          className="
            bg-white dark:bg-[#18181B]
            rounded-2xl
            border border-[#E5E5E5] dark:border-[#333333]
            shadow-sm dark:shadow-[0_1px_3px_rgba(0,0,0,0.3)]
            px-6 py-8 md:px-8 md:py-10
            flex flex-col items-center justify-center
            text-center
          "
        >
          <span
            className="
              text-2xl sm:text-3xl md:text-4xl font-bold
              text-[#6B47ED] dark:text-[#A78BFA]
              tracking-tight
              block
            "
          >
            {formatStatValue(item.value, parsedStats[index], progress)}
          </span>
          <span
            className="
              mt-2 text-sm md:text-base font-normal
              text-[#52525B] dark:text-[#A3A3A3]
            "
          >
            {item.label}
          </span>
        </div>
      ))}
    </div>
  );
};
