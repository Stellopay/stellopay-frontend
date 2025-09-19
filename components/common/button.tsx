import React, { MouseEvent, ReactNode } from "react";
import { ButtonProps } from "@/types/ui";

const Button: React.FC<ButtonProps> = ({
  text,
  disabled,
  onClick,
  loading,
  width,
  height,
  fill,
  type = "submit",
}) => {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`
        ${
          fill
            ? "bg-[#ffffff] text-[#1a1a1a]"
            : "bg-[#222222] text-[#ffffff] border border-[#2D2D2D]"
        } 
        font-medium text-[14px] rounded-[0.375rem] 
        flex items-center justify-center 
        ${disabled || loading ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
      `}
      style={{ width: width || "100%", height: height || "48px" }}
    >
      {loading ? "Loading..." : text}
    </button>
  );
};

export default Button;
