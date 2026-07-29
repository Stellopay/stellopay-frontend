"use client";

import React, { useState, useRef } from "react";

/**
 * VideoFacade — Lazy-loaded click-to-play video embed.
 *
 * Performance pattern: renders a static thumbnail + play button initially.
 * The real iframe is mounted ONLY when the user clicks — deferring all
 * third-party JS until user intent is confirmed.
 *
 * Layout shift prevention: the aspect-ratio box is reserved upfront via
 * CSS aspect-ratio, so no reflow occurs when the iframe mounts.
 *
 * WCAG 2.1 AA:
 * - Play button: role="button", aria-label, keyboard accessible
 * - iframe: title attribute for screen readers
 * - Captions link: visible and keyboard reachable
 * - Focus management: iframe receives focus after mounting
 */

interface VideoFacadeProps {
  /** Video ID on the hosting platform */
  videoId: string;
  /** Platform: 'youtube' | 'vimeo' */
  platform?: "youtube" | "vimeo";
  /** URL to the static thumbnail image */
  thumbnailUrl?: string;
  /** Alt text for the thumbnail image */
  thumbnailAlt?: string;
  /** URL to captions or transcript */
  captionsUrl?: string;
  /** Caption link label text */
  captionsLabel?: string;
  /** Aspect ratio (default: '16/9') */
  aspectRatio?: string;
  /** Title for the iframe (accessibility) */
  videoTitle?: string;
  /** Optional CSS class */
  className?: string;
}

export function VideoFacade({
  videoId,
  platform = "youtube",
  thumbnailUrl,
  thumbnailAlt = "Product demo video thumbnail",
  captionsUrl,
  captionsLabel = "View transcript",
  aspectRatio = "16/9",
  videoTitle = "Stellopay product demo",
  className,
}: VideoFacadeProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const embedUrl =
    platform === "youtube"
      ? `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0`
      : `https://player.vimeo.com/video/${videoId}?autoplay=1`;

  // Auto-generate thumbnail URL if not provided
  const thumb =
    thumbnailUrl ??
    (platform === "youtube"
      ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`
      : undefined);

  function handlePlay() {
    setIsPlaying(true);
    // Focus iframe after mount for keyboard users
    requestAnimationFrame(() => iframeRef.current?.focus());
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handlePlay();
    }
  }

  return (
    <div className={className}>
      {/* Aspect-ratio box — reserved upfront, no layout shift */}
      <div
        className="relative w-full overflow-hidden rounded-xl bg-gray-100 dark:bg-gray-800 shadow-lg"
        style={{ aspectRatio }}
      >
        {!isPlaying ? (
          /* FACADE: thumbnail + play button */
          <button
            type="button"
            onClick={handlePlay}
            onKeyDown={handleKeyDown}
            aria-label={`Play ${videoTitle}`}
            className="group absolute inset-0 w-full h-full focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-500 focus-visible:ring-offset-2 rounded-xl"
          >
            {/* Thumbnail */}
            {thumb ? (
              <img
                src={thumb}
                alt={thumbnailAlt}
                className="w-full h-full object-cover"
                loading="lazy"
                decoding="async"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-blue-600 to-purple-700 dark:from-blue-800 dark:to-purple-900" />
            )}

            {/* Dark overlay on hover */}
            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors rounded-xl" />

            {/* Play button */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div
                className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-white/90 dark:bg-white/95 shadow-xl flex items-center justify-center group-hover:scale-110 group-focus-visible:scale-110 transition-transform duration-200"
                aria-hidden="true"
              >
                {/* Play triangle */}
                <svg
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="w-8 h-8 sm:w-10 sm:h-10 text-blue-600 translate-x-0.5"
                  aria-hidden="true"
                >
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
            </div>

            {/* "Click to play" label */}
            <span
              className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white text-sm font-medium bg-black/50 px-3 py-1 rounded-full opacity-80 group-hover:opacity-100 transition-opacity"
              aria-hidden="true"
            >
              Click to play
            </span>
          </button>
        ) : (
          /* REAL EMBED: mounted only on click */
          <iframe
            ref={iframeRef}
            src={embedUrl}
            title={videoTitle}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="absolute inset-0 w-full h-full rounded-xl"
            tabIndex={0}
          />
        )}
      </div>

      {/* Captions / transcript link */}
      {captionsUrl && (
        <p className="mt-3 text-center">
          <a
            href={captionsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-blue-600 dark:text-blue-400 underline underline-offset-2 hover:text-blue-700 dark:hover:text-blue-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded"
          >
            {captionsLabel}
          </a>
        </p>
      )}
    </div>
  );
}
