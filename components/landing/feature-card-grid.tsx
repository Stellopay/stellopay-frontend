import { FC } from "react";
import { FeatureGridItem } from "@/types/landing";
import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { duration, easing } from "@/lib/motion";

interface FeatureCardGridProps extends FeatureGridItem {
  className?: string;
  index?: number;
}

export const FeatureCardGrid: FC<FeatureCardGridProps> = ({
  icon: Icon,
  title,
  description,
  link,
  className = "",
  index = 0,
}) => {
  const prefersReducedMotion = useReducedMotion();

  const animationVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: duration.slow,
        delay: index * 0.1,
        ease: easing.easeOut
      }
    }
  };

  return (
    <motion.article
      initial={prefersReducedMotion ? "visible" : "hidden"}
      whileInView="visible"
      viewport={{ once: true, margin: "-50px" }}
      variants={animationVariants}
      className={`
        rounded-lg
        relative
        p-[1px]
        bg-gradient-to-r from-[#83A7FF] to-[#8B5CF6]
        shadow-sm dark:shadow-lg dark:shadow-purple-500/5
        transition-all duration-200
        hover:shadow-md dark:hover:shadow-xl dark:hover:shadow-purple-500/10
        ${className}
      `}
    >
      <div className="bg-white dark:bg-[#1a1a1a] rounded-lg p-6 h-full ml-[2px]">
        {/* Icon with gradient background */}
        <div className="mb-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-[#83A7FF] to-[#8B5CF6] flex items-center justify-center shadow-sm">
            <Icon className="w-6 h-6 text-white" />
          </div>
        </div>

        {/* Title */}
        <h3 className="text-lg font-bold text-black dark:text-white mb-2">
          {title}
        </h3>

        {/* Description */}
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 leading-relaxed">
          {description}
        </p>

        {/* Learn more link */}
        <Link
          href={link}
          className="inline-flex items-center gap-1 text-sm font-medium text-gray-700 group dark:text-white hover:text-[#8B5CF6] dark:hover:text-[#8B5CF6]  transition-colors"
        >
          Learn more
          <ArrowRight className="w-4 h-4 group-hover:translate-x-[5px] transition-all duration-300" />
        </Link>
      </div>
    </motion.article>
  );
};
