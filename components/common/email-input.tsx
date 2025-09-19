import React, { ChangeEvent } from "react";
import { EmailInputProps } from "@/types/ui";

const EmailInput: React.FC<EmailInputProps> = ({ value, onChange }) => {
  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    onChange(event.target.value);
  };
  return (
    <div className="w-full">
      <label
        htmlFor="emailinput"
        className="text-[0.875rem] font-medium block mb-1"
      >
        Email address
      </label>
      <div
        className={`flex items-center border border-[#2D2D2D] rounded-[0.375rem]  h-[48px] md:h-[52px] overflow-hidden`}
      >
        <input
          type="text"
          id="emailinput"
          name="email"
          placeholder="Mayasullivan@gmail.com"
          value={value}
          onChange={handleChange}
          className={`px-3 w-full focus:outline-none text-[0.875rem] text-[#ffffff] `}
        />
      </div>
    </div>
  );
};

export default EmailInput;
