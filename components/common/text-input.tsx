import React, { ChangeEvent, ReactNode } from "react";
import { TextInputProps } from "@/types/ui";
import { Label } from "@/components/ui/label";
import { cn } from "@/utils/commonUtils";

interface EnhancedTextInputProps extends TextInputProps {
  error?: boolean;
  helperText?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
}

const TextInput: React.FC<EnhancedTextInputProps> = ({
  label,
  value,
  icon,
  placeholder,
  onChange,
  type = "text",
  error = false,
  helperText,
  required = false,
  disabled = false,
  className,
}) => {
  const fieldId = React.useId();
  const descriptionId = helperText ? `${fieldId}-description` : undefined;
  const errorId = error ? `${fieldId}-error` : undefined;

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const inputValue = event.target.value;

    // If type is number, ensure only numeric input
    if (type === "number" && /^[0-9]*$/.test(inputValue)) {
      onChange(inputValue);
    } else if (type === "text") {
      onChange(inputValue);
    }
  };

  const describedBy = React.useMemo(() => {
    const ids = [];
    if (descriptionId) ids.push(descriptionId);
    if (errorId) ids.push(errorId);
    return ids.length > 0 ? ids.join(" ") : undefined;
  }, [descriptionId, errorId]);

  return (
    <div className={cn("w-full space-y-2", className)}>
      {label && (
        <Label
          required={required}
          error={error}
          descriptionId={descriptionId}
          className="text-sm font-medium"
        >
          {label}
        </Label>
      )}
      <div
        className={cn(
          "flex items-center border rounded-md h-12 overflow-hidden transition-colors",
          error ? "border-destructive ring-destructive/20" : "border-input",
          disabled && "opacity-50 cursor-not-allowed",
        )}
      >
        {icon && (
          <span className="pl-4 text-muted-foreground" aria-hidden="true">
            {icon}
          </span>
        )}
        <input
          type={type}
          id={fieldId}
          name={fieldId}
          placeholder={placeholder}
          value={value}
          onChange={handleChange}
          disabled={disabled}
          className={cn(
            "px-3 w-full bg-transparent focus:outline-none text-foreground",
            icon && "pl-0",
          )}
          aria-invalid={error ? "true" : "false"}
          aria-describedby={describedBy}
          aria-required={required}
          // Disable number input spinner (this works for most modern browsers)
          inputMode={type === "number" ? "numeric" : "text"}
          pattern={type === "number" ? "[0-9]*" : undefined}
          // Disable spinner in Chrome, Firefox, Safari, etc.
          style={{
            WebkitAppearance: "none",
            MozAppearance: "textfield",
            fontSize: "14px",
          }}
        />
      </div>
      {helperText && !error && (
        <p id={descriptionId} className="text-xs text-muted-foreground">
          {helperText}
        </p>
      )}
      {error && (
        <p
          id={errorId}
          className="text-xs text-destructive"
          role="alert"
          aria-live="polite"
        >
          {helperText}
        </p>
      )}
    </div>
  );
};

export default TextInput;
