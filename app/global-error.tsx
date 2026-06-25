"use client";

/**
  Global error boundary for the root layout.
 
  Next.js segment `error.tsx` files only catch errors thrown by the *children*
  of a layout, never by the layout itself. Because `app/layout.tsx` is the
  root layout, any failure inside ThemeProvider or SidebarProvider would
  escape every inner boundary and crash the whole app silently in production.
 
  `global-error.tsx` is the one file Next.js checks for this case. It must
  render its own `<html>/<body>` shell because the root layout's shell is
  exactly what failed — it cannot be reused here.
 
  Security: only a generic message is shown. The `error` object is intentionally
  not rendered to avoid leaking stack traces or internal paths in production.
 */

interface GlobalErrorProps {
  /** The error thrown by the root layout or one of its providers. */
  error: Error & { digest?: string };
  /**
    Next.js callback that re-renders the segment tree without a full page reload.
    Optional because Next.js 15 + React 19 does not always inject it when the
    error originates in a Server Component — `handleReset` falls back to
    `window.location.reload()` in that case.
   */
  reset?: () => void;
}

/*
  Minimal full-document fallback rendered when `app/layout.tsx` itself throws.
 
  Inline styles are intentional: `globals.css` (and every stylesheet loaded
  through the layout) is unavailable at this point, so Tailwind classes would
  have no effect. The styles below are self-contained and dependency-free.
 */
export default function GlobalError({ reset }: GlobalErrorProps) {
  function handleReset() {
    if (typeof reset === "function") reset();
    else window.location.reload();
  }

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily:
            "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
          backgroundColor: "#f9fafb",
          color: "#111827",
        }}
      >
        <div
          style={{
            textAlign: "center",
            padding: "2rem",
            maxWidth: "400px",
          }}
        >
          <h1
            style={{
              fontSize: "1.5rem",
              fontWeight: 600,
              marginBottom: "0.75rem",
            }}
          >
            Something went wrong
          </h1>
          <p
            style={{
              fontSize: "0.95rem",
              color: "#6b7280",
              marginBottom: "1.5rem",
            }}
          >
            An unexpected error occurred. Please try again.
          </p>
          <button
            onClick={handleReset}
            style={{
              padding: "0.6rem 1.4rem",
              fontSize: "0.95rem",
              fontWeight: 500,
              color: "#ffffff",
              backgroundColor: "#111827",
              border: "none",
              borderRadius: "0.375rem",
              cursor: "pointer",
            }}
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
