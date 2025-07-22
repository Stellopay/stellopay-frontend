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
          className="w-[66px] h-10 flex items-center justify-center p-2"
        >
          <span
            className="text-[#92918e]  text-[18px] font-normal leading-none tracking-[-0.01em] underline decoration-solid"
            style={{ fontFamily: "General Sans, sans-serif" }}
          >
            Home
          </span>
        </Link>

        <Link
          href="#KeyFeatures"
          className="w-[66px] h-10 flex items-center justify-center p-2"
        >
          <span
            className="text-[#92918e]  text-[18px] font-normal leading-none tracking-[-0.01em] underline decoration-solid"
            style={{ fontFamily: "General Sans, sans-serif" }}
          >
            Features
          </span>
        </Link>

        <button
          onClick={handleBackToTop}
          className="w-[106px] h-10 flex items-center justify-center p-2 cursor-pointer"
        >
          <span
            className="text-[#92918e] text-[18px] font-normal whitespace-nowrap leading-none tracking-[-0.01em] underline decoration-solid"
            style={{ fontFamily: "General Sans, sans-serif" }}
          >
            Back to top
          </span>
        </button>
      </div>
    </footer>
  );
}
