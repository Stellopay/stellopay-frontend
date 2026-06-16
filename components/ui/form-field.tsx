"use client";

import * as React from "react";
import { ControllerProps, FieldPath, FieldValues } from "react-hook-form";

import { cn } from "@/utils/commonUtils";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

interface FormFieldBaseProps {
  label?: React.ReactNode;
  description?: string;
  required?: boolean;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  success?: boolean;
  warning?: boolean;
  loading?: boolean;
  successMessage?: string;
  warningMessage?: string;
}

interface FormFieldInputProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> extends FormFieldBaseProps,
    Omit<ControllerProps<TFieldValues, TName>, "render"> {
  type?: "text" | "email" | "password" | "number" | "tel" | "url";
  autoComplete?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function FormFieldInput<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  label,
  description,
  required,
  placeholder,
  disabled,
  className,
  success,
  warning,
  loading,
  successMessage,
  warningMessage,
  type = "text",
  autoComplete,
  ...controllerProps
}: FormFieldInputProps<TFieldValues, TName>) {
  const fieldId = React.useId();
  const descriptionId = `${fieldId}-description`;
  const errorId = `${fieldId}-error`;

  return (
    <FormField
      control={controllerProps.control}
      name={controllerProps.name}
      render={({ field, fieldState }) => {
        return (
          <FormItem className={cn("space-y-2", className)}>
            {label && (
              <FormLabel
                htmlFor={fieldId}
                required={required}
                error={!!fieldState.error}
                success={success}
                warning={warning}
                descriptionId={description ? descriptionId : undefined}
              >
                {label}
              </FormLabel>
            )}
            <FormControl>
              <Input
                id={fieldId}
                type={type}
                placeholder={placeholder}
                disabled={disabled}
                autoComplete={autoComplete}
                error={!!fieldState.error}
                success={success}
                warning={warning}
                loading={loading}
                labelId={label ? `${fieldId}-label` : undefined}
                descriptionId={description ? descriptionId : undefined}
                errorId={
                  fieldState.error || successMessage || warningMessage
                    ? errorId
                    : undefined
                }
                {...field}
              />
            </FormControl>
            {description && (
              <FormDescription id={descriptionId}>
                {description}
              </FormDescription>
            )}
            <FormMessage />
            {success && successMessage && !fieldState.error && (
              <FormMessage variant="success">{successMessage}</FormMessage>
            )}
            {warning && warningMessage && !fieldState.error && (
              <FormMessage variant="warning">{warningMessage}</FormMessage>
            )}
          </FormItem>
        );
      }}
    />
  );
}

interface FormFieldTextareaProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> extends FormFieldBaseProps,
    Omit<ControllerProps<TFieldValues, TName>, "render"> {
  rows?: number;
  resize?: boolean;
}

export function FormFieldTextarea<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  label,
  description,
  required,
  placeholder,
  disabled,
  className,
  success,
  warning,
  successMessage,
  warningMessage,
  rows = 4,
  resize = false,
  ...controllerProps
}: FormFieldTextareaProps<TFieldValues, TName>) {
  const fieldId = React.useId();
  const descriptionId = `${fieldId}-description`;
  const errorId = `${fieldId}-error`;

  return (
    <FormField
      control={controllerProps.control}
      name={controllerProps.name}
      render={({ field, fieldState }) => {
        return (
          <FormItem className={cn("space-y-2", className)}>
            {label && (
              <FormLabel
                htmlFor={fieldId}
                required={required}
                error={!!fieldState.error}
                success={success}
                warning={warning}
                descriptionId={description ? descriptionId : undefined}
              >
                {label}
              </FormLabel>
            )}
            <FormControl>
              <Textarea
                id={fieldId}
                placeholder={placeholder}
                disabled={disabled}
                rows={rows}
                error={!!fieldState.error}
                success={success}
                warning={warning}
                className={cn(!resize && "resize-none", className)}
                aria-describedby={
                  description ||
                  fieldState.error ||
                  successMessage ||
                  warningMessage
                    ? [description, errorId].filter(Boolean).join(" ")
                    : undefined
                }
                {...field}
              />
            </FormControl>
            {description && (
              <FormDescription id={descriptionId}>
                {description}
              </FormDescription>
            )}
            <FormMessage />
            {success && successMessage && !fieldState.error && (
              <FormMessage variant="success">{successMessage}</FormMessage>
            )}
            {warning && warningMessage && !fieldState.error && (
              <FormMessage variant="warning">{warningMessage}</FormMessage>
            )}
          </FormItem>
        );
      }}
    />
  );
}

interface FormFieldCheckboxProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> extends FormFieldBaseProps,
    Omit<ControllerProps<TFieldValues, TName>, "render"> {
  indeterminate?: boolean;
}

export function FormFieldCheckbox<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  label,
  description,
  required,
  disabled,
  className,
  success,
  warning,
  successMessage,
  warningMessage,
  indeterminate: _indeterminate,
  ...controllerProps
}: FormFieldCheckboxProps<TFieldValues, TName>) {
  const fieldId = React.useId();
  const descriptionId = `${fieldId}-description`;
  const errorId = `${fieldId}-error`;

  return (
    <FormField
      control={controllerProps.control}
      name={controllerProps.name}
      render={({ field, fieldState }) => {
        return (
          <FormItem className={cn("space-y-2", className)}>
            <div className="flex items-start space-x-2">
              <FormControl>
                <Checkbox
                  id={fieldId}
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  disabled={disabled}
                  className={cn(fieldState.error && "border-destructive")}
                  aria-invalid={fieldState.error ? "true" : "false"}
                  aria-describedby={
                    description ||
                    fieldState.error ||
                    successMessage ||
                    warningMessage
                      ? [description, errorId].filter(Boolean).join(" ")
                      : undefined
                  }
                />
              </FormControl>
              <div className="grid gap-1.5 leading-none">
                {label && (
                  <FormLabel
                    htmlFor={fieldId}
                    required={required}
                    error={!!fieldState.error}
                    success={success}
                    warning={warning}
                    descriptionId={description ? descriptionId : undefined}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {label}
                  </FormLabel>
                )}
                {description && (
                  <FormDescription id={descriptionId}>
                    {description}
                  </FormDescription>
                )}
              </div>
            </div>
            <FormMessage />
            {success && successMessage && !fieldState.error && (
              <FormMessage variant="success">{successMessage}</FormMessage>
            )}
            {warning && warningMessage && !fieldState.error && (
              <FormMessage variant="warning">{warningMessage}</FormMessage>
            )}
          </FormItem>
        );
      }}
    />
  );
}

import { Eye, EyeOff } from "lucide-react";

export function FormFieldPassword<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  label,
  description,
  required,
  placeholder,
  disabled,
  className,
  success,
  warning,
  loading,
  successMessage,
  warningMessage,
  autoComplete,
  ...controllerProps
}: FormFieldInputProps<TFieldValues, TName>) {
  const [showPassword, setShowPassword] = React.useState(false);
  const fieldId = React.useId();
  const descriptionId = `${fieldId}-description`;
  const errorId = `${fieldId}-error`;

  return (
    <FormField
      control={controllerProps.control}
      name={controllerProps.name}
      render={({ field, fieldState }) => {
        return (
          <FormItem className={cn("space-y-2", className)}>
            {label && (
              <FormLabel
                htmlFor={fieldId}
                required={required}
                error={!!fieldState.error}
                success={success}
                warning={warning}
                descriptionId={description ? descriptionId : undefined}
              >
                {label}
              </FormLabel>
            )}
            <FormControl>
              <div className="relative">
                <Input
                  id={fieldId}
                  type={showPassword ? "text" : "password"}
                  placeholder={placeholder}
                  disabled={disabled}
                  autoComplete={autoComplete}
                  error={!!fieldState.error}
                  success={success}
                  warning={warning}
                  loading={loading}
                  labelId={label ? `${fieldId}-label` : undefined}
                  descriptionId={description ? descriptionId : undefined}
                  errorId={
                    fieldState.error || successMessage || warningMessage
                      ? errorId
                      : undefined
                  }
                  className="pr-10"
                  {...field}
                  onChange={(e) => {
                    field.onChange(e);
                    // Pass to custom onChange if provided in controllerProps
                    const props = controllerProps as { onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void };
                    if (props.onChange) {
                      props.onChange(e);
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={disabled}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus:outline-none"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </FormControl>
            {description && (
              <FormDescription id={descriptionId}>
                {description}
              </FormDescription>
            )}
            <FormMessage />
            {success && successMessage && !fieldState.error && (
              <FormMessage variant="success">{successMessage}</FormMessage>
            )}
            {warning && warningMessage && !fieldState.error && (
              <FormMessage variant="warning">{warningMessage}</FormMessage>
            )}
          </FormItem>
        );
      }}
    />
  );
}

// Re-export form components for convenience
export {
  Form,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
  FormField,
  useFormField,
} from "@/components/ui/form";
