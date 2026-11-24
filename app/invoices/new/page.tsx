"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useWallet } from "@/context/wallet-context";
import {
  createInvoice,
  loadInvoices,
  updateDraftInvoice,
  setInvoiceStatus,
} from "@/lib/invoices-store";
import { createAccountScope } from "@/lib/realtime-registry";
import type { InvoiceDraft, InvoiceFormValues } from "@/types/invoice";
import { invoiceFormSchema } from "@/types/invoice";
import {
  calculateInvoiceTotals,
  formatMinorUnits,
  parseMoneyToMinorUnits,
  parseTaxRateToBps,
} from "@/utils/moneyUtils";
import { cn } from "@/utils/commonUtils";

function dateAfter(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function emptyValues(): InvoiceFormValues {
  return {
    customerName: "",
    customerEmail: "",
    currency: "USD",
    issueDate: new Date().toISOString().slice(0, 10),
    dueDate: dateAfter(30),
    taxRate: "0",
    notes: "",
    lineItems: [{ id: "", description: "", quantity: 1, unitPrice: "0.00" }],
  };
}

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p
      id={id}
      role="alert"
      className="mt-1 text-xs text-red-600 dark:text-red-400"
    >
      {message}
    </p>
  );
}

export default function NewInvoicePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editId = searchParams.get("edit");
  const { address, network } = useWallet();
  const account = createAccountScope(network.id, address);
  const [editError, setEditError] = useState<string | null>(null);

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<InvoiceFormValues>({
    resolver: zodResolver(invoiceFormSchema),
    defaultValues: emptyValues(),
    mode: "onBlur",
  });
  const { fields, append, remove } = useFieldArray({
    control,
    name: "lineItems",
  });
  const lineItems = useWatch({ control, name: "lineItems" });
  const taxRate = useWatch({ control, name: "taxRate" });

  useEffect(() => {
    if (!editId) return;
    const invoice = loadInvoices(account).find((item) => item.id === editId);
    if (!invoice) {
      setEditError("Invoice not found.");
      return;
    }
    if (invoice.status !== "draft") {
      setEditError("Only draft invoices can be edited.");
      return;
    }
    setEditError(null);
    reset({
      customerName: invoice.customerName,
      customerEmail: invoice.customerEmail,
      currency: invoice.currency,
      issueDate: invoice.issueDate,
      dueDate: invoice.dueDate,
      taxRate: invoice.taxRate,
      notes: invoice.notes,
      lineItems: invoice.lineItems.map((item) => ({
        id: item.id,
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
      })),
    });
  }, [account, editId, reset]);

  const totals = useMemo(() => {
    const bps = parseTaxRateToBps(taxRate ?? "0") ?? 0;
    return calculateInvoiceTotals(
      (lineItems ?? []).map((item) => ({
        quantity: Number(item.quantity) || 0,
        unitPriceMinorUnits: parseMoneyToMinorUnits(item.unitPrice) ?? 0,
      })),
      bps,
    );
  }, [lineItems, taxRate]);

  const submit = (values: InvoiceFormValues, status: "draft" | "sent") => {
    const draft: InvoiceDraft = {
      customerName: values.customerName.trim(),
      customerEmail: values.customerEmail.trim(),
      currency: values.currency.trim().toUpperCase(),
      issueDate: values.issueDate,
      dueDate: values.dueDate,
      taxRate: values.taxRate,
      notes: values.notes.trim(),
      status: "draft",
      lineItems: values.lineItems.map((item, index) => ({
        id: item.id || `line-${index + 1}`,
        description: item.description.trim(),
        quantity: Number(item.quantity),
        unitPrice: item.unitPrice.trim(),
      })),
    };

    try {
      if (editId) {
        updateDraftInvoice(account, editId, draft);
        if (status === "sent") setInvoiceStatus(account, editId, "sent");
      } else {
        createInvoice(account, { ...draft, status });
      }
      toast.success(
        status === "sent" ? "Invoice sent." : "Invoice saved as draft.",
      );
      router.push("/invoices");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not save invoice.",
      );
    }
  };

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <Link
        href="/invoices"
        className="inline-flex items-center gap-2 text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
      >
        <ArrowLeft aria-hidden />
        Back to invoices
      </Link>

      <h1 className="mt-6 text-3xl font-bold text-zinc-900 dark:text-white">
        {editId ? "Edit invoice" : "New invoice"}
      </h1>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
        Amounts are calculated in whole cents so totals stay exact.
      </p>

      {editError ? (
        <div
          role="alert"
          className="mt-6 rounded-xl border border-red-300 p-4 text-sm text-red-700 dark:border-red-800 dark:text-red-300"
        >
          {editError}
        </div>
      ) : (
        <form
          className="mt-8 space-y-8"
          noValidate
          onSubmit={handleSubmit((values) => submit(values, "draft"))}
        >
          <section
            aria-labelledby="invoice-customer-heading"
            className="space-y-4"
          >
            <h2 id="invoice-customer-heading" className="text-xl font-semibold">
              Customer
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="customerName"
                  className="mb-1 block text-sm font-medium"
                >
                  Customer name
                </label>
                <Input
                  id="customerName"
                  aria-invalid={Boolean(errors.customerName)}
                  aria-describedby={
                    errors.customerName ? "customerName-error" : undefined
                  }
                  {...register("customerName")}
                />
                <FieldError
                  id="customerName-error"
                  message={errors.customerName?.message}
                />
              </div>
              <div>
                <label
                  htmlFor="customerEmail"
                  className="mb-1 block text-sm font-medium"
                >
                  Customer email
                </label>
                <Input
                  id="customerEmail"
                  type="email"
                  aria-invalid={Boolean(errors.customerEmail)}
                  aria-describedby={
                    errors.customerEmail ? "customerEmail-error" : undefined
                  }
                  {...register("customerEmail")}
                />
                <FieldError
                  id="customerEmail-error"
                  message={errors.customerEmail?.message}
                />
              </div>
              <div>
                <label
                  htmlFor="currency"
                  className="mb-1 block text-sm font-medium"
                >
                  Currency
                </label>
                <Input
                  id="currency"
                  maxLength={3}
                  aria-invalid={Boolean(errors.currency)}
                  aria-describedby={
                    errors.currency ? "currency-error" : undefined
                  }
                  {...register("currency")}
                />
                <FieldError
                  id="currency-error"
                  message={errors.currency?.message}
                />
              </div>
              <div>
                <label
                  htmlFor="taxRate"
                  className="mb-1 block text-sm font-medium"
                >
                  Tax rate (%)
                </label>
                <Input
                  id="taxRate"
                  inputMode="decimal"
                  aria-invalid={Boolean(errors.taxRate)}
                  aria-describedby={
                    errors.taxRate ? "taxRate-error" : undefined
                  }
                  {...register("taxRate")}
                />
                <FieldError
                  id="taxRate-error"
                  message={errors.taxRate?.message}
                />
              </div>
              <div>
                <label
                  htmlFor="issueDate"
                  className="mb-1 block text-sm font-medium"
                >
                  Issue date
                </label>
                <Input
                  id="issueDate"
                  type="date"
                  aria-invalid={Boolean(errors.issueDate)}
                  aria-describedby={
                    errors.issueDate ? "issueDate-error" : undefined
                  }
                  {...register("issueDate")}
                />
                <FieldError
                  id="issueDate-error"
                  message={errors.issueDate?.message}
                />
              </div>
              <div>
                <label
                  htmlFor="dueDate"
                  className="mb-1 block text-sm font-medium"
                >
                  Due date
                </label>
                <Input
                  id="dueDate"
                  type="date"
                  aria-invalid={Boolean(errors.dueDate)}
                  aria-describedby={
                    errors.dueDate ? "dueDate-error" : undefined
                  }
                  {...register("dueDate")}
                />
                <FieldError
                  id="dueDate-error"
                  message={errors.dueDate?.message}
                />
              </div>
            </div>
          </section>

          <fieldset className="space-y-4">
            <legend className="text-xl font-semibold">Line items</legend>
            {errors.lineItems?.message && (
              <p role="alert" className="text-sm text-red-600">
                {errors.lineItems.message}
              </p>
            )}
            {fields.map((field, index) => (
              <div
                key={field.id}
                className="grid gap-3 rounded-xl border border-zinc-200 p-4 dark:border-zinc-800 sm:grid-cols-[2fr_1fr_1fr_auto]"
              >
                <div>
                  <label
                    htmlFor={`description-${index}`}
                    className="mb-1 block text-sm font-medium"
                  >
                    Description
                  </label>
                  <Input
                    id={`description-${index}`}
                    maxLength={200}
                    aria-invalid={Boolean(
                      errors.lineItems?.[index]?.description,
                    )}
                    {...register(`lineItems.${index}.description`)}
                  />
                  <FieldError
                    id={`description-${index}-error`}
                    message={errors.lineItems?.[index]?.description?.message}
                  />
                </div>
                <div>
                  <label
                    htmlFor={`quantity-${index}`}
                    className="mb-1 block text-sm font-medium"
                  >
                    Quantity
                  </label>
                  <Input
                    id={`quantity-${index}`}
                    type="number"
                    min={1}
                    step={1}
                    aria-invalid={Boolean(errors.lineItems?.[index]?.quantity)}
                    {...register(`lineItems.${index}.quantity`, {
                      valueAsNumber: true,
                    })}
                  />
                  <FieldError
                    id={`quantity-${index}-error`}
                    message={errors.lineItems?.[index]?.quantity?.message}
                  />
                </div>
                <div>
                  <label
                    htmlFor={`unitPrice-${index}`}
                    className="mb-1 block text-sm font-medium"
                  >
                    Unit price
                  </label>
                  <Input
                    id={`unitPrice-${index}`}
                    inputMode="decimal"
                    aria-invalid={Boolean(errors.lineItems?.[index]?.unitPrice)}
                    {...register(`lineItems.${index}.unitPrice`)}
                  />
                  <FieldError
                    id={`unitPrice-${index}-error`}
                    message={errors.lineItems?.[index]?.unitPrice?.message}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => remove(index)}
                  disabled={fields.length === 1}
                  aria-label={`Remove line item ${index + 1}`}
                  className="self-end rounded-md p-2 text-red-600 hover:bg-red-50 disabled:opacity-50 dark:text-red-400 dark:hover:bg-red-950"
                >
                  <Trash2 aria-hidden />
                </button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                append({
                  id: "",
                  description: "",
                  quantity: 1,
                  unitPrice: "0.00",
                })
              }
            >
              <Plus aria-hidden />
              Add line item
            </Button>
          </fieldset>

          <section
            aria-labelledby="invoice-notes-heading"
            className="space-y-2"
          >
            <h2 id="invoice-notes-heading" className="text-xl font-semibold">
              Notes
            </h2>
            <label htmlFor="notes" className="sr-only">
              Invoice notes
            </label>
            <textarea
              id="notes"
              rows={3}
              maxLength={1000}
              aria-invalid={Boolean(errors.notes)}
              {...register("notes")}
              className={cn(
                "w-full rounded-md border border-input bg-transparent p-3 text-sm shadow-xs outline-none",
                "focus-visible:ring-2 focus-visible:ring-blue-500",
              )}
            />
            <FieldError id="notes-error" message={errors.notes?.message} />
          </section>

          <section
            aria-labelledby="invoice-totals-heading"
            className="rounded-xl bg-zinc-50 p-5 dark:bg-zinc-900"
          >
            <h2 id="invoice-totals-heading" className="text-lg font-semibold">
              Summary
            </h2>
            <dl aria-live="polite" className="mt-3 space-y-2 text-sm">
              <div className="flex justify-between">
                <dt>Subtotal</dt>
                <dd data-testid="invoice-subtotal" className="tabular-nums">
                  {formatMinorUnits(totals.subtotalMinorUnits)}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt>Tax</dt>
                <dd data-testid="invoice-tax" className="tabular-nums">
                  {formatMinorUnits(totals.taxMinorUnits)}
                </dd>
              </div>
              <div className="flex justify-between text-base font-bold">
                <dt>Total</dt>
                <dd data-testid="invoice-total" className="tabular-nums">
                  {formatMinorUnits(totals.totalMinorUnits)}
                </dd>
              </div>
            </dl>
          </section>

          <div className="flex flex-wrap gap-3">
            <Button type="submit">Save draft</Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleSubmit((values) => submit(values, "sent"))}
            >
              Save &amp; send
            </Button>
            <Button type="button" variant="ghost" asChild>
              <Link href="/invoices">Cancel</Link>
            </Button>
          </div>
        </form>
      )}
    </main>
  );
}
