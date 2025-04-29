import { SquareArrowOutUpRight } from "lucide-react";
import React from "react";

interface FaqCardProps {
  title: string;
  subtitle: string;
}

const FaqCard: React.FC<FaqCardProps> = ({ title, subtitle }) => {
  return (
    <div className="w-full bg-[#121212] border border-[#2E2E2E] rounded-xl p-4 sm:p-5 md:p-6 hover:shadow-lg transition-shadow duration-300">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex-1">
          <h3 className="text-base sm:text-lg font-semibold text-white mb-1">
            {title}
          </h3>
          <p className="line-clamp-2 text-sm sm:text-base text-[#707070]">{subtitle}</p>
        </div>

        <div className="flex justify-center items-center border border-[#2E2E2E] rounded-lg w-8 h-8 min-w-[2rem] min-h-[2rem]">
          <SquareArrowOutUpRight size={18} color="#E5E5E5" />
        </div>
      </div>
    </div>
  );
};

export default FaqCard;
