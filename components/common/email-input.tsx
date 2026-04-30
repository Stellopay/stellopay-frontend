import React, { ChangeEvent } from "react";
import { EmailInputProps } from "@/types/ui";
import { Label } from "@/components/ui/label";
import { cn } from "@/utils/commonUtils";

interface EnhancedEmailInputProps extends EmailInputProps {
  label?: string;
  error?: boolean;
  helperText?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  placeholder?: string;
}

const EmailInput: React.FC<EnhancedEmailInputProps> = ({
  value,
  onChange,
  label = "Email address",
  error = false,
  helperText,
  required = false,
  disabled = false,
  className,
  placeholder = "example@email.com",
}) => {
  const fieldId = React.useId();
  const descriptionId = helperText ? `${fieldId}-description` : undefined;
  const errorId = error ? `${fieldId}-error` : undefined;

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    onChange(event.target.value);
  };

  const describedBy = React.useMemo(() => {
    const ids = [];
    if (descriptionId) ids.push(descriptionId);
    if (errorId) ids.push(errorId);
    return ids.length > 0 ? ids.join(" ") : undefined;
  }, [descriptionId, errorId]);

  return (
    <div className={cn("w-full space-y-2", className)}>
      <Label
        required={required}
        error={error}
        descriptionId={descriptionId}
        className="text-sm font-medium"
      >
        {label}
      </Label>
      <div
        className={cn(
          "flex items-center border rounded-md h-12 overflow-hidden transition-colors",
          error ? "border-destructive ring-destructive/20" : "border-input",
          disabled && "opacity-50 cursor-not-allowed",
        )}
      >
        <input
          type="email"
          id={fieldId}
          name={fieldId}
          placeholder={placeholder}
          value={value}
          onChange={handleChange}
          disabled={disabled}
          className="px-3 w-full bg-transparent focus:outline-none text-foreground"
          aria-invalid={error ? "true" : "false"}
          aria-describedby={describedBy}
          aria-required={required}
          autoComplete="email"
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

export default EmailInput;
