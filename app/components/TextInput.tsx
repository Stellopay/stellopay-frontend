import React, { ChangeEvent, ReactNode } from "react";

interface TextInputProps {
  label?: string;
  value: string;
  icon?: ReactNode;
  placeholder?: string;
  onChange: (value: string) => void;
  type?: "text" | "number"; 
}

const TextInput: React.FC<TextInputProps> = ({
  label,
  value,
  icon,
  placeholder,
  onChange,
  type = "text",
}) => {
  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const inputValue = event.target.value;

    // If type is number, ensure only numeric input
    if (type === "number" && /^[0-9]*$/.test(inputValue)) {
      onChange(inputValue);
    } else if (type === "text") {
      onChange(inputValue);
    }
  };

  return (
    <div className="w-full group">
      <label
        htmlFor="textinput"
        className="text-[0.875rem] font-medium block mb-1"
      >
        {label ? label : "Input"}
      </label>
      <div
        className={`flex items-center border border-[#2D2D2D] rounded-[0.375rem]  h-[48px] md:h-[52px] overflow-hidden`}
      >
        {icon && (
          <span className="pl-[20px] ">
            {icon}
          </span>
        )}
        <input
          type={type} 
          id="textinput"
          name="textinput"
          placeholder={placeholder}
          value={value}
          onChange={handleChange}
          className="px-3 w-full focus:outline-none text-[#ffffff]"
          // Disable number input spinner (this works for most modern browsers)
          inputMode={type === "number" ? "numeric" : "text"}
          pattern={type === "number" ? "[0-9]*" : undefined}
          // Disable spinner in Chrome, Firefox, Safari, etc.
          style={{
            WebkitAppearance: "none",
            MozAppearance: "textfield",
            fontSize: "14px", 
            paddingRight: "10px", 
          }}
        />
      </div>
    </div>
  );
};

export default TextInput;
