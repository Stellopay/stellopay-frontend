import React, { ChangeEvent, useState, useId, useMemo } from "react";
import { EmailInputProps } from "@/types/ui";
import { Label } from "@/components/ui/label";
import { cn } from "@/utils/commonUtils";
import { isValidEmail } from "@/utils/authUtils";

interface EnhancedEmailInputProps extends EmailInputProps {
  label?: string;
  error?: boolean;
  helperText?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  placeholder?: string;
  onBlur?: (event: React.FocusEvent<HTMLInputElement>) => void;
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
  onBlur,
}) => {
  const [localError, setLocalError] = useState(false);
  const fieldId = useId();

  const descriptionId = helperText ? `${fieldId}-description` : undefined;
  const errorId = error ? `${fieldId}-error` : undefined;
  const localErrorId = localError ? `${fieldId}-local-error` : undefined;

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const val = event.target.value;
    onChange(val);
    if (val.trim() === "" || isValidEmail(val)) {
      setLocalError(false);
    }
  };

  const handleBlur = (event: React.FocusEvent<HTMLInputElement>) => {
    const isMalformed = value.trim() !== "" && !isValidEmail(value);
    setLocalError(isMalformed);
    if (onBlur) {
      onBlur(event);
    }
  };

  const describedBy = useMemo(() => {
    const ids = [];
    if (descriptionId && !error) ids.push(descriptionId);
    if (errorId) ids.push(errorId);
    if (localErrorId) ids.push(localErrorId);
    return ids.length > 0 ? ids.join(" ") : undefined;
  }, [descriptionId, errorId, localErrorId, error]);

  const hasAnyError = error || localError;

  return (
    <div className={cn("w-full space-y-2", className)}>
      <Label
        htmlFor={fieldId}
        required={required}
        error={hasAnyError}
        descriptionId={descriptionId}
        className="text-sm font-medium"
      >
        {label}
      </Label>
      <div
        className={cn(
          "flex items-center border rounded-md h-12 overflow-hidden transition-colors",
          hasAnyError ? "border-destructive ring-destructive/20" : "border-input",
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
          onBlur={handleBlur}
          disabled={disabled}
          className="px-3 w-full bg-transparent focus:outline-none text-foreground"
          aria-invalid={hasAnyError ? "true" : "false"}
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
      {!error && localError && (
        <p
          id={localErrorId}
          className="text-xs text-destructive"
          role="alert"
          aria-live="polite"
        >
          Please enter a valid email address
        </p>
      )}
    </div>
  );
};

export default EmailInput;
