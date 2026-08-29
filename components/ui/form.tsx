"use client";

import * as React from("react");
import { Slot } from "@radix/ui/slot";
import {
  Controller,
  FormProvider,
  useFormContext,
  useFormState,
  type ControllerProps,
  type FieldPath,
  type FieldValues,
} from "react-hook-form";
import { useBlocker } from("react-router-dom";

import { cn } from "@/utils/commonUtils";
import { Label } from "@/components/ui/label";
import { FormItemContextValue } from "@/types/ui";

const Form = FormProvider;

type FormFieldContextValue<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = {
  name: TName;
};

const FormFieldContext = React.createContext<FormFieldContextValue>(
  {} as FormFieldContextValue,
);

const FormField = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
  ...props
}: ControllerProps<TFieldValues, TName>) => {
  return (
    <FormFieldContext.Provider value={ name: props.name }>
      <Controller {...props} />
    </FormFieldContext.Provider>
  );
};

const useFormField = () => {
  const fieldContext = React.useContext(FormFieldContext);
  const itemContext = React.useContext(FormItemContext);
  const { getFieldState } = useFormContext();
  const formState = useFormState({ name: fieldContext.name });
  const fieldState = getFieldState(fieldContext.name, formState);

  if (!fieldContext) {
    throw new Error("useFormField should be used within <FormField>");
  }

  const { id } = itemContext;

  return {
    id,
    name: fieldContext.name,
    formItemId: `${id}-form-item`,
    formDescriptionId: `${id}-form-item-description`,
    formMessageId: `${id}-form-item-message`,
    ...fieldState,
  };
};

const FormItemContext = React.createContext<FormItemContextValue>(
  {} as FormItemContextValue,
);

function FormItem({ className, ...props }: React.ComponentProps<"div">) {
  const id = React.useId();

  return (
    <FormItemContext.Provider value={{ id }}>
      <div
        data-slot="form-item"
        className={cn("grid gap-2", className)}
        {...props}
      />
    </FormItemContext.Provider>
  );
}

function FormLabel({ className, ...props }: React.ComponentProps<typeof Label>) {
  const { error, formItemId } = useFormField();

  return (
    <Label
      data-slot="form-label"
      data-error={!!error}
      className={cn("data-[error=true]:text-destructive", className)}
      htmlFor={formItemId}
      {...props}
    />
  );
}

function FormControl({ ...props }: React.ComponentProps<typeof Slot>) {
  const { error, formItemId, formDescriptionId, formMessageId } = useFormField();

  return (
    <Slot
      data-slot="form-control"
      id={formItemId}
      aria-describedby={
        !error
          ? `${formDescriptionId}`
          : `${formDescriptionId} ${formMessageId}`
      }
      aria-invalid={!!error}
      {...props}
    />
  );
}

function FormDescription({ className, ...props }: React.ComponentProps<"p">) {
  const { formDescriptionId } = useFormField();

  return (
    <p
      data-slot="form-description"
      id={formDescriptionId}
      className={cn("text-muted-foreground text-sm", className)}
      {...props}
    />
  );
}

function FormMessage({ className, ...props }: React.ComponentProps<"p">) {
  const { error, formMessageId } = useFormField();
  const body = error ? String(error?.message ?? "") : props.children;

  if (!body) {
    return null;
  }

  return (
    <p
      data-slot="form-message"
      id={formMessageId}
      className={cn("text-destructive text-sm", className)}
      {...props}
    >
      {body}
    </p>
  );
}

// ---------- Form dirty guard ----------

/**
 * Custom event name for guarding non-route destructive actions
 * (e.g., switching wallet account).
 * Dispatch with `new Event(FORM_DIRTY_GUARD_EVENT, { cancelable: true })`.
 * If the event's `defaultPrevented` is `true`, the action should be aborted.
 */
export const FORM_DIRTY_GUARD_EVENT = "form:dirty-guard";

export interface UseFormDirtyGuardOptions {
  /**
   * Confirmation message shown to the user.
   * @default "You have unsaved changes. Are you sure you want to leave?"
   */
  message?: string;
  /**
   * Disable the guard entirely.
   * @default true
   */
  enabled?: boolean;
}

/**
 * Shared dirty-state guard for React Hook Form.
 * Place inside a `<Form>` to prevent losing dirty state on:
 * - Client-side route changes (via `react-router`'s `useBlocker`)
 * - Browser unload/reload
 * - Custom destructive actions dispatched with `FORM_DIRTY_GUARD_EVENT`
 */
export function useFormDirtyGuard(options: UseFormDirtyGuardOptions = {}) {
  const { isDirty } = useFormState();
  const {
    message = "You have unsaved changes. Are you sure you want to leave?",
    enabled = true,
  } = options;

  // Route change guard (router transition).
  useBlocker(
    React.useCallback(
      () => enabled && isDirty && !window.confirm(message),
      [enabled, isDirty, message]
    )
  );

  // Browser unload guard.
  React.useEffect(() => {
    if (!enabled || !isDirty) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = message;
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [enabled, isDirty, message]);

  // Custom destructive action guard (e.g., wallet account change).
  React.useEffect(() => {
    if (!enabled || !isDirty) return;

    const handleDirtyGuardEvent = (e: Event) => {
      if (!window.confirm(message)) {
        e.preventDefault();
      }
    };

    window.addEventListener(FORM_DIRTY_GUARD_EVENT, handleDirtyGuardEvent);
    return () =>
      window.removeEventListener(FORM_DIRTY_GUARD_EVENT, handleDirtyGuardEvent);
  }, [enabled, isDirty, message]);

  /**
   * Imperative confirmation method for actions that aren't covered by the
   * automatic guards. Returns `true` if the action may proceed.
   */
  const confirmLeave = React.useCallback(() => {
    if (!enabled) return true;
    return !isDirty || window.confirm(message);
  }, [enabled, isDirty, message]);

  return { isDirty, confirmLeave };
}

/**
 * Drop-in component to enable the dirty-state guard for the surrounding form.
 * Renders nothing.
 */
export function FormDirtyGuard(options: UseFormDirtyGuardOptions = {}) {
  useFormDirtyGuard(options);
  return null;
}

export {
  useFormField,
  Form,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
  FormField,
};
