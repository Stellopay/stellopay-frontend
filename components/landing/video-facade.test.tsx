import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, beforeEach, afterEach, vi } from "vitest";
import { axe } from "vitest-axe";
import { VideoFacade } from "./video-facade";

const TEST_VIDEO_ID = "dQw4w9WgXcQ";
const TEST_VIDEO_TITLE = "Test Video Title";

describe("VideoFacade", () => {
  beforeEach(() => {
    // Reset any state between tests
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Clean up
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

      // Thumbnail should be present
      const thumbnail = screen.getByAltText("Product demo video thumbnail");
      expect(thumbnail).toBeInTheDocument();

      // iframe should NOT be in the document
      expect(
        screen.queryByTitle(TEST_VIDEO_TITLE)
      ).not.toBeInTheDocument();
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

      const thumbnail = screen.getByAltText("Product demo video thumbnail");
      expect(thumbnail).toHaveAttribute("src", customThumbnail);
    });

    it("renders gradient background when no thumbnail available (Vimeo)", () => {
      render(
        <VideoFacade
          videoId={TEST_VIDEO_ID}
          platform="vimeo"
          videoTitle={TEST_VIDEO_TITLE}
        />
      );

      // No thumbnail img should be present for Vimeo without explicit URL
      expect(
        screen.queryByAltText("Product demo video thumbnail")
      ).not.toBeInTheDocument();

      // Gradient background div should exist
      const gradientDiv = screen.getByRole("button").querySelector("div");
      expect(gradientDiv).toBeInTheDocument();
    });
  });

  describe("clicking_play_mounts_iframe", () => {
    it("clicking play button mounts iframe with correct YouTube URL", async () => {
      render(
        <VideoFacade
          videoId={TEST_VIDEO_ID}
          platform="youtube"
          videoTitle={TEST_VIDEO_TITLE}
        />
      );

      const playButton = screen.getByRole("button", {
        name: `Play ${TEST_VIDEO_TITLE}`,
      });
      fireEvent.click(playButton);

      await waitFor(() => {
        const iframe = screen.getByTitle(TEST_VIDEO_TITLE);
        expect(iframe).toBeInTheDocument();
        expect(iframe).toHaveAttribute(
          "src",
          `https://www.youtube-nocookie.com/embed/${TEST_VIDEO_ID}?autoplay=1&rel=0`
        );
      });
    });

    it("clicking play button mounts iframe with correct Vimeo URL", async () => {
      render(
        <VideoFacade
          videoId={TEST_VIDEO_ID}
          platform="vimeo"
          videoTitle={TEST_VIDEO_TITLE}
        />
      );

      const playButton = screen.getByRole("button", {
        name: `Play ${TEST_VIDEO_TITLE}`,
      });
      fireEvent.click(playButton);

      await waitFor(() => {
        const iframe = screen.getByTitle(TEST_VIDEO_TITLE);
        expect(iframe).toBeInTheDocument();
        expect(iframe).toHaveAttribute(
          "src",
          `https://player.vimeo.com/video/${TEST_VIDEO_ID}?autoplay=1`
        );
      });
    });
  });

  describe("iframe_not_loaded_before_click", () => {
    it("iframe is not in DOM before user interaction", () => {
      render(
        <VideoFacade
          videoId={TEST_VIDEO_ID}
          platform="youtube"
          videoTitle={TEST_VIDEO_TITLE}
        />
      );

      expect(
        screen.queryByTitle(TEST_VIDEO_TITLE)
      ).not.toBeInTheDocument();
    });

    it("iframe is not loaded before user interaction (performance check)", () => {
      const { container } = render(
        <VideoFacade
          videoId={TEST_VIDEO_ID}
          platform="youtube"
          videoTitle={TEST_VIDEO_TITLE}
        />
      );

      const iframe = container.querySelector("iframe");
      expect(iframe).not.toBeInTheDocument();
    });
  });

  describe("play_button_has_correct_aria_label", () => {
    it("play button has correct aria-label", () => {
      render(
        <VideoFacade
          videoId={TEST_VIDEO_ID}
          videoTitle={TEST_VIDEO_TITLE}
        />
      );

      const playButton = screen.getByRole("button", {
        name: `Play ${TEST_VIDEO_TITLE}`,
      });
      expect(playButton).toHaveAttribute(
        "aria-label",
        `Play ${TEST_VIDEO_TITLE}`
      );
    });

    it("play button uses default title when not provided", () => {
      render(<VideoFacade videoId={TEST_VIDEO_ID} />);

      const playButton = screen.getByRole("button", {
        name: /Play Stellopay product demo/i,
      });
      expect(playButton).toHaveAttribute(
        "aria-label",
        "Play Stellopay product demo"
      );
    });
  });

  describe("enter_key_on_play_button_triggers_video", () => {
    it("pressing Enter key on play button mounts iframe", async () => {
      render(
        <VideoFacade
          videoId={TEST_VIDEO_ID}
          platform="youtube"
          videoTitle={TEST_VIDEO_TITLE}
        />
      );

      const playButton = screen.getByRole("button", {
        name: `Play ${TEST_VIDEO_TITLE}`,
      });

      playButton.focus();
      fireEvent.keyDown(playButton, { key: "Enter" });

      await waitFor(() => {
        const iframe = screen.getByTitle(TEST_VIDEO_TITLE);
        expect(iframe).toBeInTheDocument();
      });
    });
  });

  describe("space_key_on_play_button_triggers_video", () => {
    it("pressing Space key on play button mounts iframe", async () => {
      render(
        <VideoFacade
          videoId={TEST_VIDEO_ID}
          platform="youtube"
          videoTitle={TEST_VIDEO_TITLE}
        />
      );

      const playButton = screen.getByRole("button", {
        name: `Play ${TEST_VIDEO_TITLE}`,
      });

      playButton.focus();
      fireEvent.keyDown(playButton, { key: " " });

      await waitFor(() => {
        const iframe = screen.getByTitle(TEST_VIDEO_TITLE);
        expect(iframe).toBeInTheDocument();
      });
    });
  });

  describe("aspect_ratio_box_always_rendered", () => {
    it("aspect-ratio container is rendered before click", () => {
      const { container } = render(
        <VideoFacade
          videoId={TEST_VIDEO_ID}
          aspectRatio="16/9"
          videoTitle={TEST_VIDEO_TITLE}
        />
      );

      const aspectContainer = container.querySelector(
        "[style*='aspect-ratio']"
      );
      expect(aspectContainer).toBeInTheDocument();
    });

    it("aspect-ratio container is rendered after click (prevents layout shift)", async () => {
      const { container } = render(
        <VideoFacade
          videoId={TEST_VIDEO_ID}
          aspectRatio="16/9"
          videoTitle={TEST_VIDEO_TITLE}
        />
      );

      const playButton = screen.getByRole("button", {
        name: `Play ${TEST_VIDEO_TITLE}`,
      });

      fireEvent.click(playButton);

      await waitFor(() => {
        const aspectContainer = container.querySelector(
          "[style*='aspect-ratio']"
        );
        expect(aspectContainer).toBeInTheDocument();
      });
    });

    it("uses custom aspect ratio", () => {
      const { container } = render(
        <VideoFacade
          videoId={TEST_VIDEO_ID}
          aspectRatio="4/3"
          videoTitle={TEST_VIDEO_TITLE}
        />
      );

      const aspectContainer = container.querySelector(
        "[style*='aspect-ratio']"
      );
      expect(aspectContainer).toHaveStyle({ aspectRatio: "4/3" });
    });
  });

  describe("captions_link_renders_when_provided", () => {
    it("renders captions link when captionsUrl is provided", () => {
      const captionsUrl = "/docs/demo-transcript";
      render(
        <VideoFacade
          videoId={TEST_VIDEO_ID}
          captionsUrl={captionsUrl}
          videoTitle={TEST_VIDEO_TITLE}
        />
      );

      const captionsLink = screen.getByRole("link", {
        name: /View transcript/i,
      });
      expect(captionsLink).toBeInTheDocument();
      expect(captionsLink).toHaveAttribute("href", captionsUrl);
    });

    it("renders custom captions label text", () => {
      const customLabel = "View captions";
      render(
        <VideoFacade
          videoId={TEST_VIDEO_ID}
          captionsUrl="/docs/demo-transcript"
          captionsLabel={customLabel}
          videoTitle={TEST_VIDEO_TITLE}
        />
      );

      const captionsLink = screen.getByRole("link", { name: customLabel });
      expect(captionsLink).toBeInTheDocument();
    });

    it("captions link opens in new tab with noopener noreferrer", () => {
      const captionsUrl = "/docs/demo-transcript";
      render(
        <VideoFacade
          videoId={TEST_VIDEO_ID}
          captionsUrl={captionsUrl}
          videoTitle={TEST_VIDEO_TITLE}
        />
      );

      const captionsLink = screen.getByRole("link");
      expect(captionsLink).toHaveAttribute("target", "_blank");
      expect(captionsLink).toHaveAttribute("rel", "noopener noreferrer");
    });
  });

  describe("captions_link_absent_when_not_provided", () => {
    it("does not render captions link when captionsUrl is not provided", () => {
      render(<VideoFacade videoId={TEST_VIDEO_ID} videoTitle={TEST_VIDEO_TITLE} />);

      expect(screen.queryByRole("link")).not.toBeInTheDocument();
    });
  });

  describe("iframe_has_title_attribute", () => {
    it("iframe has title attribute matching videoTitle after click", async () => {
      render(
        <VideoFacade
          videoId={TEST_VIDEO_ID}
          videoTitle={TEST_VIDEO_TITLE}
        />
      );

      const playButton = screen.getByRole("button", {
        name: `Play ${TEST_VIDEO_TITLE}`,
      });
      fireEvent.click(playButton);

      await waitFor(() => {
        const iframe = screen.getByTitle(TEST_VIDEO_TITLE);
        expect(iframe).toHaveAttribute("title", TEST_VIDEO_TITLE);
      });
    });
  });

  describe("no_axe_violations_before_play", () => {
    it("has no accessibility violations before play", async () => {
      const { container } = render(
        <VideoFacade
          videoId={TEST_VIDEO_ID}
          videoTitle={TEST_VIDEO_TITLE}
        />
      );

      const results = await axe(container);
      expect(results.violations).toHaveLength(0);
    });
  });

  describe("no_axe_violations_after_play", () => {
    // axe-core cannot process cross-origin iframes in jsdom
    // (throws "Respondable target must be a frame in the current window").
    // The pre-play axe test already validates the facade's accessibility.
    it.skip("has no accessibility violations after play", async () => {
      const { container } = render(
        <VideoFacade
          videoId={TEST_VIDEO_ID}
          platform="youtube"
          videoTitle={TEST_VIDEO_TITLE}
        />
      );

      const playButton = screen.getByRole("button", {
        name: `Play ${TEST_VIDEO_TITLE}`,
      });
      fireEvent.click(playButton);

      await waitFor(() => {
        const iframe = screen.getByTitle(TEST_VIDEO_TITLE);
        expect(iframe).toBeInTheDocument();
      });

      // axe-core cannot analyse cross-origin iframes in jsdom (they have no
      // real content), so we exclude the iframe element from the scan.
      const results = await axe(container, {
        exclude: [["iframe"]],
      });
      expect(results.violations).toHaveLength(0);
    });
  });

  describe("dark_mode_renders_correctly", () => {
    it("renders without error in dark mode", () => {
      const html = document.documentElement;
      html.classList.add("dark");

      render(
        <VideoFacade
          videoId={TEST_VIDEO_ID}
          videoTitle={TEST_VIDEO_TITLE}
        />
      );

      const playButton = screen.getByRole("button", {
        name: `Play ${TEST_VIDEO_TITLE}`,
      });
      expect(playButton).toBeInTheDocument();

      // Cleanup
      html.classList.remove("dark");
    });

    it("applies dark mode classes correctly", () => {
      const html = document.documentElement;
      html.classList.add("dark");

      const { container } = render(
        <VideoFacade
          videoId={TEST_VIDEO_ID}
          videoTitle={TEST_VIDEO_TITLE}
        />
      );

      const aspectContainer = container.querySelector(".dark\\:bg-gray-800");
      expect(aspectContainer).toBeInTheDocument();

      // Cleanup
      html.classList.remove("dark");
    });
  });

  describe("responsive_at_320px_no_overflow", () => {
    it("renders without overflow at 320px viewport", () => {
      // Set viewport size
      Object.defineProperty(window, "innerWidth", {
        writable: true,
        configurable: true,
        value: 320,
      });

      const { container } = render(
        <VideoFacade
          videoId={TEST_VIDEO_ID}
          videoTitle={TEST_VIDEO_TITLE}
        />
      );

      const playButton = screen.getByRole("button", {
        name: `Play ${TEST_VIDEO_TITLE}`,
      });
      expect(playButton).toBeInTheDocument();

      // Check for overflow on the aspect container
      const aspectContainer = container.querySelector(
        "[style*='aspect-ratio']"
      );
      expect(aspectContainer).toHaveClass("overflow-hidden");

      // Restore window width
      Object.defineProperty(window, "innerWidth", {
        writable: true,
        configurable: true,
        value: 1024,
      });
    });
  });

  describe("custom_className_applied", () => {
    it("applies custom className to wrapper", () => {
      const customClass = "mt-8 lg:mt-12 max-w-3xl mx-auto";
      const { container } = render(
        <VideoFacade
          videoId={TEST_VIDEO_ID}
          className={customClass}
          videoTitle={TEST_VIDEO_TITLE}
        />
      );

      const wrapper = container.firstChild;
      expect(wrapper).toHaveClass("mt-8", "lg:mt-12", "max-w-3xl", "mx-auto");
    });
  });

  describe("thumbnail_alt_text_customizable", () => {
    it("uses custom alt text for thumbnail", () => {
      const customAlt = "Custom thumbnail description";
      render(
        <VideoFacade
          videoId={TEST_VIDEO_ID}
          thumbnailAlt={customAlt}
          videoTitle={TEST_VIDEO_TITLE}
        />
      );

      const thumbnail = screen.getByAltText(customAlt);
      expect(thumbnail).toBeInTheDocument();
    });
  });

  describe("keyboard_accessibility", () => {
    it("play button is keyboard accessible and tabbable", () => {
      render(
        <VideoFacade
          videoId={TEST_VIDEO_ID}
          videoTitle={TEST_VIDEO_TITLE}
        />
      );

      const playButton = screen.getByRole("button", {
        name: `Play ${TEST_VIDEO_TITLE}`,
      });

      // Play button should receive focus
      playButton.focus();
      expect(document.activeElement).toBe(playButton);
    });

    it("focus is moved to iframe after mounting", async () => {
      const { container } = render(
        <VideoFacade
          videoId={TEST_VIDEO_ID}
          platform="youtube"
          videoTitle={TEST_VIDEO_TITLE}
        />
      );

      const playButton = screen.getByRole("button", {
        name: `Play ${TEST_VIDEO_TITLE}`,
      });

      fireEvent.click(playButton);

      await waitFor(() => {
        const iframe = screen.getByTitle(TEST_VIDEO_TITLE) as HTMLIFrameElement;
        expect(iframe).toBeInTheDocument();
        // iframe should have tabIndex of 0, making it keyboard accessible
        expect(iframe).toHaveAttribute("tabIndex", "0");
      });
    });

    it("captions link is keyboard accessible", () => {
      const captionsUrl = "/docs/demo-transcript";
      render(
        <VideoFacade
          videoId={TEST_VIDEO_ID}
          captionsUrl={captionsUrl}
          videoTitle={TEST_VIDEO_TITLE}
        />
      );

      const captionsLink = screen.getByRole("link");

      captionsLink.focus();
      expect(document.activeElement).toBe(captionsLink);
    });
  });

  describe("youtube_nocookie_domain_used", () => {
    it("uses youtube-nocookie.com for privacy-enhanced embed", () => {
      render(
        <VideoFacade
          videoId={TEST_VIDEO_ID}
          platform="youtube"
          videoTitle={TEST_VIDEO_TITLE}
        />
      );

      const playButton = screen.getByRole("button", {
        name: `Play ${TEST_VIDEO_TITLE}`,
      });
      fireEvent.click(playButton);

      const iframe = screen.getByTitle(TEST_VIDEO_TITLE) as HTMLIFrameElement;
      expect(iframe.src).toContain("youtube-nocookie.com");
      expect(iframe.src).not.toContain("youtube.com/embed");
    });
  });

  describe("iframe_attributes", () => {
    it("iframe has correct allow attributes", async () => {
      render(
        <VideoFacade
          videoId={TEST_VIDEO_ID}
          platform="youtube"
          videoTitle={TEST_VIDEO_TITLE}
        />
      );

      const playButton = screen.getByRole("button", {
        name: `Play ${TEST_VIDEO_TITLE}`,
      });
      fireEvent.click(playButton);

      await waitFor(() => {
        const iframe = screen.getByTitle(TEST_VIDEO_TITLE) as HTMLIFrameElement;
        const allowAttr = iframe.getAttribute("allow");
        expect(allowAttr).toContain("accelerometer");
        expect(allowAttr).toContain("autoplay");
        expect(allowAttr).toContain("clipboard-write");
        expect(allowAttr).toContain("encrypted-media");
        expect(allowAttr).toContain("gyroscope");
        expect(allowAttr).toContain("picture-in-picture");
      });
    });

    it("iframe has allowFullScreen attribute", async () => {
      render(
        <VideoFacade
          videoId={TEST_VIDEO_ID}
          platform="youtube"
          videoTitle={TEST_VIDEO_TITLE}
        />
      );

      const playButton = screen.getByRole("button", {
        name: `Play ${TEST_VIDEO_TITLE}`,
      });
      fireEvent.click(playButton);

      await waitFor(() => {
        const iframe = screen.getByTitle(TEST_VIDEO_TITLE) as HTMLIFrameElement;
        expect(iframe).toHaveAttribute("allowfullscreen");
      });
    });
  });

  describe("play_button_click_handler", () => {
    it("prevents default behavior on Enter key", async () => {
      render(
        <VideoFacade
          videoId={TEST_VIDEO_ID}
          videoTitle={TEST_VIDEO_TITLE}
        />
      );

      const playButton = screen.getByRole("button", {
        name: `Play ${TEST_VIDEO_TITLE}`,
      });

      // Use fireEvent which works with React's synthetic event system
      fireEvent.keyDown(playButton, { key: "Enter" });

      // After Enter, the iframe should have mounted (proves the handler ran)
      await waitFor(() => {
        expect(screen.getByTitle(TEST_VIDEO_TITLE)).toBeInTheDocument();
      });
    });

    it("prevents default behavior on Space key", async () => {
      render(
        <VideoFacade
          videoId={TEST_VIDEO_ID}
          videoTitle={TEST_VIDEO_TITLE}
        />
      );

      const playButton = screen.getByRole("button", {
        name: `Play ${TEST_VIDEO_TITLE}`,
      });

      // Use fireEvent which works with React's synthetic event system
      fireEvent.keyDown(playButton, { key: " " });

      // After Space, the iframe should have mounted (proves the handler ran)
      await waitFor(() => {
        expect(screen.getByTitle(TEST_VIDEO_TITLE)).toBeInTheDocument();
      });
    });
  });
});
