import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, beforeEach, afterEach, vi } from "vitest";
import { axe } from "vitest-axe";

import * as toHaveNoViolationsExport from "vitest-axe/matchers";
import { VideoFacade } from "./video-facade";

// Register vitest-axe matchers
const matchers = (toHaveNoViolationsExport as any).default || toHaveNoViolationsExport;
expect.extend(matchers);

const TEST_VIDEO_ID = "dQw4w9WgXcQ";
const TEST_VIDEO_TITLE = "Test Video Title";

describe("VideoFacade", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("render_thumbnail_not_iframe_by_default", () => {
    it("renders thumbnail image, not iframe initially", () => {
      render(
        <VideoFacade
          videoId={TEST_VIDEO_ID}
          platform="youtube"
          videoTitle={TEST_VIDEO_TITLE}
        />
      );

      const thumbnail = screen.getByAltText("Product demo video thumbnail");
      expect(thumbnail).toBeInTheDocument();
      expect(screen.queryByTitle(TEST_VIDEO_TITLE)).not.toBeInTheDocument();
    });

    it("renders auto-generated YouTube thumbnail URL", () => {
      render(
        <VideoFacade
          videoId={TEST_VIDEO_ID}
          platform="youtube"
          videoTitle={TEST_VIDEO_TITLE}
        />
      );

      const thumbnail = screen.getByAltText("Product demo video thumbnail");
      expect(thumbnail).toHaveAttribute(
        "src",
        `https://img.youtube.com/vi/${TEST_VIDEO_ID}/maxresdefault.jpg`
      );
    });

    it("renders custom thumbnail URL when provided", () => {
      const customThumbnail = "https://example.com/custom-thumb.jpg";
      render(
        <VideoFacade
          videoId={TEST_VIDEO_ID}
          platform="youtube"
          thumbnailUrl={customThumbnail}
          videoTitle={TEST_VIDEO_TITLE}
        />
      );

      expect(screen.getByAltText("Product demo video thumbnail")).toHaveAttribute(
        "src",
        customThumbnail
      );
    });

    it("renders gradient fallback when no thumbnail is available", () => {
      render(
        <VideoFacade
          videoId={TEST_VIDEO_ID}
          platform="vimeo"
          videoTitle={TEST_VIDEO_TITLE}
        />
      );

      expect(
        screen.queryByAltText("Product demo video thumbnail")
      ).not.toBeInTheDocument();

      const fallback = screen
        .getByRole("button")
        .querySelector(".bg-gradient-to-br");
      expect(fallback).toBeInTheDocument();
      expect(fallback).toHaveClass("from-blue-600", "to-purple-700");
    });
  });

  describe("clicking_play_mounts_iframe", () => {
    it("mounts the YouTube iframe with the expected URL", async () => {
      render(
        <VideoFacade
          videoId={TEST_VIDEO_ID}
          platform="youtube"
          videoTitle={TEST_VIDEO_TITLE}
        />
      );

      fireEvent.click(screen.getByRole("button", {
        name: `Play ${TEST_VIDEO_TITLE}`,
      }));

      await waitFor(() => {
        expect(screen.getByTitle(TEST_VIDEO_TITLE)).toHaveAttribute(
          "src",
          `https://www.youtube-nocookie.com/embed/${TEST_VIDEO_ID}?autoplay=1&rel=0`
        );
      });
    });

    it("mounts the Vimeo iframe with the expected URL", async () => {
      render(
        <VideoFacade
          videoId={TEST_VIDEO_ID}
          platform="vimeo"
          videoTitle={TEST_VIDEO_TITLE}
        />
      );

      fireEvent.click(screen.getByRole("button", {
        name: `Play ${TEST_VIDEO_TITLE}`,
      }));

      await waitFor(() => {
        expect(screen.getByTitle(TEST_VIDEO_TITLE)).toHaveAttribute(
          "src",
          `https://player.vimeo.com/video/${TEST_VIDEO_ID}?autoplay=1`
        );
      });
    });
  });

  it("keeps the aspect-ratio container after playback starts", async () => {
    const { container } = render(
      <VideoFacade videoId={TEST_VIDEO_ID} aspectRatio="4/3" />
    );

    expect(container.querySelector("[style*='aspect-ratio']")).toHaveStyle({
      aspectRatio: "4/3",
    });

    fireEvent.click(screen.getByRole("button"));

    await waitFor(() => {
      expect(screen.getByTitle("Stellopay product demo")).toBeInTheDocument();
      expect(container.querySelector("[style*='aspect-ratio']")).toBeInTheDocument();
    });
  });

  it("renders the captions link only when a URL is provided", () => {
    const { rerender } = render(<VideoFacade videoId={TEST_VIDEO_ID} />);

    expect(screen.queryByRole("link")).not.toBeInTheDocument();

    rerender(
      <VideoFacade
        videoId={TEST_VIDEO_ID}
        captionsUrl="/docs/demo-transcript"
        captionsLabel="View captions"
      />
    );

    expect(screen.getByRole("link", { name: "View captions" })).toHaveAttribute(
      "href",
      "/docs/demo-transcript"
    );
  });

  it("has no accessibility violations before playback", async () => {
    const { container } = render(
      <VideoFacade videoId={TEST_VIDEO_ID} videoTitle={TEST_VIDEO_TITLE} />
    );

    const results = await axe(container);
    expect(results.violations).toHaveLength(0);
  });
});
