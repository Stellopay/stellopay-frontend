"use client";

import * as React from "react";
import {
  Controller,
  ControllerProps,
  FieldPath,
  FieldValues,
} from "react-hook-form";

import { cn } from "@/utils/commonUtils";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

interface FormFieldBaseProps {
  label?: string;
  description?: string;
  required?: boolean;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

interface FormFieldInputProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>
  extends
    FormFieldBaseProps,
    Omit<ControllerProps<TFieldValues, TName>, "render"> {
  type?: "text" | "email" | "password" | "number" | "tel" | "url";
  autoComplete?: string;
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
  type = "text",
  autoComplete,
  ...controllerProps
}: FormFieldInputProps<TFieldValues, TName>) {
  return (
    <FormField
      control={controllerProps.control}
      name={controllerProps.name}
      render={({ field, fieldState }) => {
        const fieldId = React.useId();
        const descriptionId = `${fieldId}-description`;
        const errorId = `${fieldId}-error`;

        return (
          <FormItem className={cn("space-y-2", className)}>
            {label && (
              <FormLabel
                htmlFor={fieldId}
                required={required}
                error={!!fieldState.error}
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
                labelId={label ? `${fieldId}-label` : undefined}
                descriptionId={description ? descriptionId : undefined}
                errorId={fieldState.error ? errorId : undefined}
                {...field}
              />
            </FormControl>
            {description && (
              <FormDescription id={descriptionId}>
                {description}
              </FormDescription>
            )}
            <FormMessage />
          </FormItem>
        );
      }}
    />
  );
}

interface FormFieldTextareaProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>
  extends
    FormFieldBaseProps,
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
  rows = 4,
  resize = false,
  ...controllerProps
}: FormFieldTextareaProps<TFieldValues, TName>) {
  return (
    <FormField
      control={controllerProps.control}
      name={controllerProps.name}
      render={({ field, fieldState }) => {
        const fieldId = React.useId();
        const descriptionId = `${fieldId}-description`;
        const errorId = `${fieldId}-error`;

        return (
          <FormItem className={cn("space-y-2", className)}>
            {label && (
              <FormLabel
                htmlFor={fieldId}
                required={required}
                error={!!fieldState.error}
                descriptionId={description ? descriptionId : undefined}
              >
                {label}
              </FormLabel>
            )}
            <FormControl>
              <textarea
                id={fieldId}
                placeholder={placeholder}
                disabled={disabled}
                rows={rows}
                className={cn(
                  "flex min-h-[60px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
                  fieldState.error && "border-destructive ring-destructive/20",
                  !resize && "resize-none",
                  className,
                )}
                aria-invalid={fieldState.error ? "true" : "false"}
                aria-describedby={
                  description || fieldState.error
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
          </FormItem>
        );
      }}
    />
  );
}

interface FormFieldCheckboxProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>
  extends
    FormFieldBaseProps,
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
  indeterminate,
  ...controllerProps
}: FormFieldCheckboxProps<TFieldValues, TName>) {
  return (
    <FormField
      control={controllerProps.control}
      name={controllerProps.name}
      render={({ field, fieldState }) => {
        const fieldId = React.useId();
        const descriptionId = `${fieldId}-description`;
        const errorId = `${fieldId}-error`;

        return (
          <FormItem className={cn("space-y-2", className)}>
            <div className="flex items-start space-x-2">
              <FormControl>
                <input
                  type="checkbox"
                  id={fieldId}
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  disabled={disabled}
                  className={cn(
                    "h-4 w-4 rounded border border-primary text-primary focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
                    fieldState.error && "border-destructive",
                  )}
                  aria-invalid={fieldState.error ? "true" : "false"}
                  aria-describedby={
                    description || fieldState.error
                      ? [description, errorId].filter(Boolean).join(" ")
                      : undefined
                  }
                  ref={(element) => {
                    if (element && indeterminate) {
                      element.indeterminate = true;
                    }
                  }}
                />
              </FormControl>
              <div className="grid gap-1.5 leading-none">
                {label && (
                  <FormLabel
                    htmlFor={fieldId}
                    required={required}
                    error={!!fieldState.error}
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
