"use client";

import Link from "next/link";

export default function Footer() {
  const handleBackToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <footer className="w-full bg-[#040404] py-4">
      <div className="max-w-[1040px] mx-auto h-10 flex items-center justify-center gap-[10px] px-4">
        <Link
          href="/"
          className="h-10 flex items-center justify-center p-2"
        >
          <span
            className="text-[#909090] text-lg font-general leading-none tracking-[-0.01em] underline decoration-solid"
            style={{ fontFamily: "General Sans, sans-serif" }}
          >
            Home
          </span>
        </Link>

        <Link
          href="#KeyFeatures"
          className="h-10 flex items-center justify-center p-2"
        >
          <span
            className="text-[#909090] text-lg font-general leading-none tracking-[-0.01em] underline decoration-solid"
            style={{ fontFamily: "General Sans, sans-serif" }}
          >
            Features
          </span>
        </Link>

        <button
          onClick={handleBackToTop}
          className="h-10 flex items-center justify-center p-2 cursor-pointer"
        >
          <span
            className="text-[#909090] text-lg font-general whitespace-nowrap leading-none tracking-[-0.01em] underline decoration-solid"
            style={{ fontFamily: "General Sans, sans-serif" }}
          >
            Back to top
          </span>
        </button>
      </div>
    </footer>
  );
}
