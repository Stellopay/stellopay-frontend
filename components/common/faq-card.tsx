"use client";
import { SquareArrowOutUpRight } from "lucide-react";
import React from "react";
import { useRouter } from "next/navigation";
import { FaqCardProps } from "@/types/ui";
import { HighlightText } from "@/components/common/highlight-text";
import { cn } from "@/utils/commonUtils";

const FaqCard: React.FC<FaqCardProps> = ({
  title,
  subtitle,
  link,
  highlightQuery,
  icon,
  articleCount,
}) => {
  const router = useRouter();

  const handleCardClick = () => {
    router.push(link || "/settings/preferences");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      handleCardClick();
    }
  };

  return (
    <div
      onClick={handleCardClick}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      aria-label={
        articleCount !== undefined
          ? `${title}: ${articleCount} article${articleCount !== 1 ? "s" : ""}`
          : title
      }
      className={cn(
        "w-full rounded-xl border p-5 transition-all duration-200 cursor-pointer",
        "bg-white dark:bg-[#121212] border-zinc-200 dark:border-[#2E2E2E]",
        "hover:shadow-md hover:border-zinc-300 dark:hover:border-zinc-600",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 dark:focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-[#121212]",
      )}
    >
      <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          {icon && (
            <div
              className="flex-shrink-0 flex justify-center items-center border border-zinc-200 dark:border-[#2E2E2E] rounded-lg w-10 h-10"
              aria-hidden="true"
            >
              {icon}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-semibold text-zinc-900 dark:text-white mb-1">
              <HighlightText text={title} query={highlightQuery || ""} />
            </h3>
            <p className="line-clamp-2 text-sm text-zinc-500 dark:text-[#707070] mt-1">
              <HighlightText text={subtitle} query={highlightQuery || ""} />
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {articleCount !== undefined && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-[#1A1A2E] text-[#A0A0A0] border border-[#2E2E2E]">
              {articleCount} article{articleCount !== 1 ? "s" : ""}
            </span>
          )}
          <div className="flex justify-center items-center border border-zinc-200 dark:border-[#2E2E2E] rounded-lg w-8 h-8 min-w-[2rem] min-h-[2rem] shrink-0 mt-0.5">
            <SquareArrowOutUpRight
              size={18}
              className="text-zinc-700 dark:text-[#E5E5E5]"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default FaqCard;
