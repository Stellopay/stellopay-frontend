"use client";
import { SquareArrowOutUpRight } from "lucide-react";
import React from "react";
import { useRouter } from "next/navigation";
import { FaqCardProps } from "@/types/ui";
 ui/notifications-section-channel-matrix
import { HighlightText } from "@/components/common/highlight-text";

import { cn } from "@/utils/commonUtils";
 main

const FaqCard: React.FC<FaqCardProps> = ({
  title,
  subtitle,
  link,
 ui/notifications-section-channel-matrix
  highlightQuery,

  icon,
  articleCount,
 main
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
      role="link"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleCardClick();
        }
      }}
      aria-label={
        articleCount !== undefined
          ? `${title}: ${articleCount} article${articleCount !== 1 ? "s" : ""}`
          : title
      }
      className="w-full bg-[#121212] border border-[#2E2E2E] rounded-xl p-4 sm:p-5 md:p-6 hover:shadow-2xl hover:scale-105 transition-all duration-300 ease-in-out cursor-pointer"
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
 ui/notifications-section-channel-matrix
        <div className="flex-1">
          <h3 className="text-base  font-semibold text-white mb-1">
            <HighlightText text={title} query={highlightQuery || ""} />
          </h3>
          <p className="line-clamp-2 text-sm  text-[#707070]">
            <HighlightText text={subtitle} query={highlightQuery || ""} />
          </p>

        <div className="flex items-start gap-3 flex-1 min-w-0">
          {icon && (
            <div
              className="flex-shrink-0 flex justify-center items-center border border-[#2E2E2E] rounded-lg w-10 h-10"
              aria-hidden="true"
            >
              {icon}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-semibold text-white mb-1">
              {title}
            </h3>
            <p className="line-clamp-2 text-sm text-[#707070]">{subtitle}</p>
          </div>
 main
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {articleCount !== undefined && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-[#1A1A2E] text-[#A0A0A0] border border-[#2E2E2E]">
              {articleCount} article{articleCount !== 1 ? "s" : ""}
            </span>
          )}
          <div className="flex justify-center items-center border border-[#2E2E2E] rounded-lg w-8 h-8 min-w-[2rem] min-h-[2rem]">
            <SquareArrowOutUpRight size={18} color="#E5E5E5" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default FaqCard;
