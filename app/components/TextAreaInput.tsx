import React, { ChangeEvent, ReactNode } from "react";

interface TextareaInputProps {
  label?: string;
  value: string;
  icon?: ReactNode;
  placeholder?: string;
  onChange: (value: string) => void;
  rows?: number;
}

const TextareaInput: React.FC<TextareaInputProps> = ({
  label,
  value,
  icon,
  placeholder,
  onChange,
  rows = 4,
}) => {
  const handleChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    onChange(event.target.value);
  };

  return (
    <div className="w-full group">
      <label
        htmlFor="textareainput"
        className="text-[0.875rem] font-medium block mb-1"
      >
        {label ? label : "Textarea"}
      </label>
      <div
        className={`flex items-start border border-[#2D2D2D] rounded-[0.375rem] min-h-[48px] md:min-h-[52px] overflow-hidden`}
      >
        {icon && <span className="pl-[20px] pt-[12px]">{icon}</span>}
        <textarea
          id="textareainput"
          name="textareainput"
          placeholder={placeholder}
          value={value}
          onChange={handleChange}
          rows={rows}
          className="px-3 py-3 w-full h-[10rem] resize-none focus:outline-none text-[#ffffff] bg-transparent"
          style={{
            fontSize: "14px",
            paddingRight: "10px",
            WebkitBoxShadow: "0 0 0 1000px transparent inset",
          }}
        />
      </div>
    </div>
  );
};

export default TextareaInput;
