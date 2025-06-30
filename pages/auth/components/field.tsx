import React, { ReactNode } from "react";

interface FieldProps {
  type: string;
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  icon?: React.ReactNode;
}

export const Field = ({ label, value, type, onChange, icon }: FieldProps) => {
  const id = `input-${label.replace(/[^a-z0-9]/gi, '-').toLowerCase()}`;
  return (
    <div className="relative">
      <input
        type={type}
        id={id}
        value={value}
        onChange={onChange}
        className={`peer w-full border-[1.5px] border-gray-500 rounded-xl bg-transparent px-4 pt-6 pb-2 text-white placeholder-transparent transition-colors duration-200 focus:border-[#722f7e] focus:outline-none`}
      />
      <label
        htmlFor={id}
        className={`absolute left-4 transition-all duration-150 bg-[#1A0C1D] px-1 ${
          value || value.length > 0
            ? "-top-2 text-sm peer-focus:text-[#722f7e]"
            : "top-4 text-base text-gray-500 peer-focus:-top-2 peer-focus:text-sm peer-focus:text-[#722f7e]"
        }`}
      >
        {label}
      </label>
      <div className="absolute right-4 top-5 text-gray-400 peer-focus:text-[#722f7e]">
        {icon}
      </div>
    </div>
  );
};
