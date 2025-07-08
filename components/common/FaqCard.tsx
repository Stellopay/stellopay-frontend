"use client";
import { SquareArrowOutUpRight } from "lucide-react";
import React from "react";
import { useRouter } from "next/navigation";

interface FaqCardProps {
  title: string;
  subtitle: string;
  link?: string;
}

const FaqCard: React.FC<FaqCardProps> = ({ title, subtitle, link }) => {
  const router = useRouter();

  // Dummy navigation
  const handleCardClick = () => {
    router.push(link || "/settings/preferences");
  };

  return (
    <div
      onClick={handleCardClick}
      className="w-full bg-[#121212] border border-[#2E2E2E] rounded-xl p-4 sm:p-5 md:p-6 hover:shadow-2xl hover:scale-105 transition-all duration-300 ease-in-out cursor-pointer"
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex-1">
          <h3 className="text-base  font-semibold text-white mb-1">{title}</h3>
          <p className="line-clamp-2 text-sm  text-[#707070]">{subtitle}</p>
        </div>

        <div className="flex justify-center items-center border border-[#2E2E2E] rounded-lg w-8 h-8 min-w-[2rem] min-h-[2rem]">
          <SquareArrowOutUpRight size={18} color="#E5E5E5" />
        </div>
      </div>
    </div>
  );
};

export default FaqCard;
