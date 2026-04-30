import React, { ChangeEvent, ReactNode } from "react";
import { TextareaInputProps } from "@/types/ui";
import { Label } from "@/components/ui/label";
import { cn } from "@/utils/commonUtils";

interface EnhancedTextareaInputProps extends TextareaInputProps {
  error?: boolean;
  helperText?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  resize?: boolean;
}

const TextareaInput: React.FC<EnhancedTextareaInputProps> = ({
  label,
  value,
  icon,
  placeholder,
  onChange,
  rows = 4,
  error = false,
  helperText,
  required = false,
  disabled = false,
  className,
  resize = false,
}) => {
  const fieldId = React.useId();
  const descriptionId = helperText ? `${fieldId}-description` : undefined;
  const errorId = error ? `${fieldId}-error` : undefined;

  const handleChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
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
          "flex items-start border rounded-md overflow-hidden transition-colors",
          error ? "border-destructive ring-destructive/20" : "border-input",
          disabled && "opacity-50 cursor-not-allowed",
        )}
      >
        {icon && (
          <span className="pl-4 pt-3 text-muted-foreground" aria-hidden="true">
            {icon}
          </span>
        )}
        <textarea
          id={fieldId}
          name={fieldId}
          placeholder={placeholder}
          value={value}
          onChange={handleChange}
          rows={rows}
          disabled={disabled}
          className={cn(
            "px-3 py-3 w-full bg-transparent focus:outline-none text-foreground",
            !resize && "resize-none",
            icon && "pl-0",
          )}
          aria-invalid={error ? "true" : "false"}
          aria-describedby={describedBy}
          aria-required={required}
          style={{
            fontSize: "14px",
            WebkitBoxShadow: "0 0 0 1000px transparent inset",
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

export default TextareaInput;
