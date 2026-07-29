import React, { ChangeEvent } from "react";
import { TextareaInputProps } from "@/types/ui";
import { Label } from "@/components/ui/label";
import { cn } from "@/utils/commonUtils";
import {
  INPUT_WRAPPER_CLASSES,
  INPUT_DEFAULT_CLASSES,
  INPUT_ERROR_CLASSES,
  INPUT_DISABLED_CLASSES,
  INPUT_INNER_CLASSES,
} from "./input-tokens";

interface EnhancedTextareaInputProps extends TextareaInputProps {
  error?: boolean;
  helperText?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  resize?: boolean;
  maxLength?: number;
  onBlur?: (event: React.FocusEvent<HTMLTextAreaElement>) => void;
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
  onBlur,
}) => {
  const fieldId = React.useId();
  const descriptionId = helperText ? `${fieldId}-description` : undefined;
  const errorId = error ? `${fieldId}-error` : undefined;
  const counterId = maxLength !== undefined ? `${fieldId}-counter` : undefined;

  const charCount = value.length;
  const isOverLimit = maxLength !== undefined && charCount > maxLength;
  const isNearLimit =
    maxLength !== undefined && !isOverLimit && maxLength - charCount <= 20;

  const handleChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    const next = event.target.value;
    // Block input beyond maxLength — prevent silent truncation on submit.
    if (maxLength !== undefined && next.length > maxLength) return;
    onChange(next);
  };

  const describedBy = React.useMemo(() => {
    const ids: string[] = [];
    if (descriptionId) ids.push(descriptionId);
    if (errorId) ids.push(errorId);
    if (counterId) ids.push(counterId);
    return ids.length > 0 ? ids.join(" ") : undefined;
  }, [descriptionId, errorId, counterId]);

  return (
    <div className={cn("w-full space-y-2", className)}>
      {label && (
        <Label
          htmlFor={fieldId}
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
          INPUT_WRAPPER_CLASSES,
          "items-start",
          error || isOverLimit
            ? INPUT_ERROR_CLASSES
            : INPUT_DEFAULT_CLASSES,
          disabled && INPUT_DISABLED_CLASSES,
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
          onBlur={onBlur}
          rows={rows}
          disabled={disabled}
          maxLength={maxLength}
          className={cn(INPUT_INNER_CLASSES, "py-3", !resize && "resize-none", icon && "pl-0")}
          aria-invalid={error || isOverLimit ? "true" : "false"}
          aria-describedby={describedBy}
          aria-required={required}
          style={{
            fontSize: "14px",
            WebkitBoxShadow: "0 0 0 1000px transparent inset",
          }}
        />
      </div>

      {/* Footer row: helper/error text on the left, character counter on the right */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1">
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

        {maxLength !== undefined && (
          /*
           * aria-live="polite" ensures screen readers announce the counter
           * update without interrupting. We only trigger announcement when
           * nearing or at the limit to avoid constant chatter.
           */
          <p
            id={counterId}
            aria-live={isNearLimit || isOverLimit ? "polite" : "off"}
            aria-atomic="true"
            className={cn(
              "text-xs whitespace-nowrap shrink-0",
              isOverLimit
                ? "text-destructive font-medium"
                : isNearLimit
                  ? "text-amber-500"
                  : "text-muted-foreground",
            )}
          >
            {charCount}/{maxLength}
          </p>
        )}
      </div>
    </div>
  );
};

export default TextareaInput;
