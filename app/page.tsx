"use client";
import Image from "next/image";
import NotificationPanel from "@/components/NotificationPanel";
import { SideBar } from "./components/SideBar";
import useSidebar from "@/context/SidebarContext";
import { Sidebar } from "lucide-react";

// Mock, remove this
const notifications = [
  {
    title: "Payment Sent",
    message: "#TXN12345 · Your payment of 250 XLM to...",
    read: false,
  },
  {
    title: "Payment Received",
    message: "#TXN12345 · You've received 500 USDC...",
    read: true,
  },
  {
    title: "Low Balance Alert",
    message: "Your balance is below 50 XLM. Consider adding...",
    read: false,
  },
];

export default function Home() {
  const { isSidebarOpen, setSidebarOpen, isMobile } = useSidebar();

  return (
    <div className="relative bg-[#201322]">
      {/* Main Grid Layout */}
      <div
        className={`grid transition-all duration-300 ease-in-out ${
          isMobile
            ? isSidebarOpen
              ? "grid-cols-1" // Mobile with fullscreen sidebar
              : "grid-cols-1" // Mobile without sidebar
            : isSidebarOpen
              ? "grid-cols-[16.25rem_1fr]" // Desktop expanded
              : "grid-cols-[6rem_1fr]" // Desktop collapsed
        }`}
      >
        {/* Only render sidebar in grid for desktop */}
        {!isMobile && <SideBar />}

        {/* Main content area */}
        <div className="bg-[#201322] grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)] relative">
          <button
            onClick={() => setSidebarOpen(!isSidebarOpen)}
            className="absolute left-4 top-8 z-50"
          >
            <Sidebar className="text-white" />
          </button>

          {/* Main content */}
          <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">
            <NotificationPanel notifications={notifications} />

            <Image
              className="dark:invert"
              src="/next.svg"
              alt="Next.js logo"
              width={180}
              height={38}
              priority
            />
            <ol className="list-inside list-decimal text-sm/6 text-center sm:text-left font-[family-name:var(--font-geist-mono)]">
              <li className="mb-2 tracking-[-.01em]">
                Get started by editing{" "}
                <code className="bg-black/[.05] dark:bg-white/[.06] px-1 py-0.5 rounded font-[family-name:var(--font-geist-mono)] font-semibold">
                  app/page.tsx
                </code>
                .
              </li>
              <li className="tracking-[-.01em]">
                Save and see your changes instantly.
              </li>
            </ol>

            <div className="flex gap-4 items-center flex-col sm:flex-row">
              <a
                className="rounded-full border border-solid border-transparent transition-colors flex items-center justify-center bg-foreground text-background gap-2 hover:bg-[#383838] dark:hover:bg-[#ccc] font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 sm:w-auto"
                href="https://vercel.com/new?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Image
                  className="dark:invert"
                  src="/vercel.svg"
                  alt="Vercel logomark"
                  width={20}
                  height={20}
                />
                Deploy now
              </a>
              <a
                className="rounded-full border border-solid border-black/[.08] dark:border-white/[.145] transition-colors flex items-center justify-center hover:bg-[#f2f2f2] dark:hover:bg-[#1a1a1a] hover:border-transparent font-medium text-sm sm:text-base h-10 sm:h-12 px-4 sm:px-5 w-full sm:w-auto md:w-[158px]"
                href="https://nextjs.org/docs?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
                target="_blank"
                rel="noopener noreferrer"
              >
                Read our docs
              </a>
            </div>
          </main>

          {/* Footer */}
          <footer className="row-start-3 flex gap-[24px] flex-wrap items-center justify-center">
            <a
              className="flex items-center gap-2 hover:underline hover:underline-offset-4"
              href="https://nextjs.org/learn?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Image
                aria-hidden
                src="/file.svg"
                alt="File icon"
                width={16}
                height={16}
              />
              Learn
            </a>
            <a
              className="flex items-center gap-2 hover:underline hover:underline-offset-4"
              href="https://vercel.com/templates?framework=next.js&utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Image
                aria-hidden
                src="/window.svg"
                alt="Window icon"
                width={16}
                height={16}
              />
              Examples
            </a>
            <a
              className="flex items-center gap-2 hover:underline hover:underline-offset-4"
              href="https://nextjs.org?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Image
                aria-hidden
                src="/globe.svg"
                alt="Globe icon"
                width={16}
                height={16}
              />
              Go to nextjs.org →
            </a>
          </footer>
        </div>
      </div>

      {/* Mobile fullscreen sidebar - renders outside of grid */}
      {isMobile && isSidebarOpen && (
        <div className="fixed inset-0 z-50 bg-black  ">
          <div className="h-full w-full sm:w-4/5 max-w-sm bg-[#101010] overflow-auto">
            <SideBar />
          </div>
        </div>
      )}
    </div>
  );
}
