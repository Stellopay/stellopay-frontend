"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useWallet } from "@/context/wallet-context";
import { useUnsavedChangesGuard } from "@/hooks/useUnsavedChangesGuard";
import { createContract } from "@/lib/contracts-store";
import { createAccountScope } from "@/lib/realtime-registry";
import type {
  ContractMilestoneFormValue,
  ContractWizardValues,
  ReleaseCondition,
} from "@/types/contract";
import {
  contractWizardSchema,
  milestoneTotalMinorUnits,
  toContractDraft,
} from "@/types/contract";
import { formatMinorUnits, parseMoneyToMinorUnits } from "@/utils/moneyUtils";
import { cn } from "@/utils/commonUtils";

const STEPS = ["Parties", "Terms", "Milestones", "Review"] as const;

const STEP_FIELDS: Array<Array<keyof ContractWizardValues>> = [
  ["parties"],
  ["title", "description", "currency", "totalAmount", "releaseCondition", "schedule"],
  ["milestones"],
  [],
];

const RELEASE_CONDITION_LABELS: Record<ReleaseCondition, string> = {
  manual: "Manual release",
  milestone_approval: "Milestone approval",
  scheduled: "Scheduled release",
};

function makeMilestoneId(): string {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }
  return `milestone-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function emptyValues(): ContractWizardValues {
  return {
    title: "",
    description: "",
    currency: "USD",
    totalAmount: "0.00",
    parties: [
      { name: "", address: "", role: "client" },
      { name: "", address: "", role: "contractor" },
    ],
    releaseCondition: "milestone_approval",
    schedule: undefined,
    milestones: [
      { id: makeMilestoneId(), title: "", amount: "0.00", dueDate: "" },
    ],
  };
}

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} role="alert" className="mt-1 text-xs text-red-600 dark:text-red-400">
      {message}
    </p>
  );
}

export default function NewContractPage() {
  const router = useRouter();
  const { address, network } = useWallet();
  const account = createAccountScope(network.id, address);
  const [stepIndex, setStepIndex] = useState(0);
  const [stepError, setStepError] = useState<string | null>(null);
  const [hasSchedule, setHasSchedule] = useState(false);

  const {
    control,
    register,
    handleSubmit,
    trigger,
    setValue,
    watch,
    formState: { errors, isDirty },
  } = useForm<ContractWizardValues>({
    resolver: zodResolver(contractWizardSchema),
    defaultValues: emptyValues(),
    mode: "onBlur",
  });

  const { fields: parties, append: appendParty, remove: removeParty } =
    useFieldArray({ control, name: "parties" });
  const {
    fields: milestones,
    append: appendMilestone,
    remove: removeMilestone,
  } = useFieldArray({ control, name: "milestones" });

  const values = watch();
  const watchedMilestones = useWatch({ control, name: "milestones" });
  const milestoneValues = (watchedMilestones ?? []) as ContractMilestoneFormValue[];
  const totalMinorUnits = parseMoneyToMinorUnits(values.totalAmount ?? "") ?? 0;
  const milestoneSum = milestoneTotalMinorUnits(milestoneValues);
  const totalMismatch = totalMinorUnits <= 0 || milestoneSum !== totalMinorUnits;
  const { clearDirty } = useUnsavedChangesGuard(isDirty);

  const handleNext = async () => {
    setStepError(null);
    const valid = await trigger(STEP_FIELDS[stepIndex], { shouldFocus: true });
    if (!valid) return;

    if (stepIndex === 0) {
      const roles = values.parties.map((party) => party.role);
      if (!roles.includes("client") || !roles.includes("contractor")) {
        setStepError("Add at least one client and one contractor.");
        return;
      }
    }

    if (stepIndex === 2 && totalMismatch) {
      setStepError("Milestone amounts must add up to the contract total.");
      return;
    }

    setStepIndex((current) => Math.min(current + 1, STEPS.length - 1));
  };

  const handleBack = () => {
    setStepError(null);
    setStepIndex((current) => Math.max(current - 1, 0));
  };

  const handleScheduleToggle = (checked: boolean) => {
    setHasSchedule(checked);
    setValue(
      "schedule",
      checked
        ? { startDate: "", endDate: "", interval: "monthly" }
        : undefined,
      { shouldDirty: true },
    );
  };

  const submit = (formValues: ContractWizardValues) => {
    const parsed = contractWizardSchema.safeParse(formValues);
    if (!parsed.success) {
      setStepError("Review the highlighted fields before creating the contract.");
      return;
    }
    try {
      createContract(account, toContractDraft(parsed.data));
      clearDirty();
      toast.success("Contract saved as draft.");
      router.push("/contracts");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not save contract.",
      );
    }
  };

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <Link
        href="/contracts"
        className="inline-flex items-center gap-2 text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
      >
        <ArrowLeft aria-hidden />
        Back to contracts
      </Link>

      <h1 className="mt-6 text-3xl font-bold text-zinc-900 dark:text-white">
        New escrow contract
      </h1>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
        Define the parties, schedule and milestone releases. The contract is
        saved as a draft for a later on-chain submission.
      </p>

      <ol
        aria-label="Contract setup steps"
        className="mt-8 flex flex-wrap gap-2"
      >
        {STEPS.map((label, index) => (
          <li
            key={label}
            aria-current={index === stepIndex ? "step" : undefined}
            className={cn(
              "rounded-full border px-3 py-1.5 text-sm font-medium",
              index === stepIndex
                ? "border-blue-600 bg-blue-50 text-blue-800 dark:bg-blue-950 dark:text-blue-200"
                : "border-zinc-200 text-zinc-600 dark:border-zinc-700 dark:text-zinc-300",
            )}
          >
            {index + 1}. {label}
          </li>
        ))}
      </ol>

      <form className="mt-8 space-y-8" noValidate onSubmit={handleSubmit(submit)}>
        {stepError && (
          <div
            role="alert"
            className="rounded-xl border border-red-300 p-4 text-sm text-red-700 dark:border-red-800 dark:text-red-300"
          >
            {stepError}
          </div>
        )}

        {stepIndex === 0 && (
          <section aria-labelledby="contract-parties-heading" className="space-y-4">
            <h2 id="contract-parties-heading" className="text-xl font-semibold">
              Parties
            </h2>
            <FieldError id="parties-error" message={errors.parties?.message} />
            {parties.map((party, index) => (
              <div
                key={party.id}
                className="grid gap-3 rounded-xl border border-zinc-200 p-4 dark:border-zinc-800 sm:grid-cols-[1fr_1.4fr_1fr_auto]"
              >
                <div>
                  <label
                    htmlFor={`party-name-${index}`}
                    className="mb-1 block text-sm font-medium"
                  >
                    Name
                  </label>
                  <Input
                    id={`party-name-${index}`}
                    aria-invalid={Boolean(errors.parties?.[index]?.name)}
                    {...register(`parties.${index}.name`)}
                  />
                  <FieldError
                    id={`party-name-${index}-error`}
                    message={errors.parties?.[index]?.name?.message}
                  />
                </div>
                <div>
                  <label
                    htmlFor={`party-address-${index}`}
                    className="mb-1 block text-sm font-medium"
                  >
                    Stellar address
                  </label>
                  <Input
                    id={`party-address-${index}`}
                    aria-invalid={Boolean(errors.parties?.[index]?.address)}
                    {...register(`parties.${index}.address`)}
                  />
                  <FieldError
                    id={`party-address-${index}-error`}
                    message={errors.parties?.[index]?.address?.message}
                  />
                </div>
                <div>
                  <label
                    htmlFor={`party-role-${index}`}
                    className="mb-1 block text-sm font-medium"
                  >
                    Role
                  </label>
                  <select
                    id={`party-role-${index}`}
                    className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs"
                    {...register(`parties.${index}.role`)}
                  >
                    <option value="client">Client</option>
                    <option value="contractor">Contractor</option>
                  </select>
                </div>
                <button
                  type="button"
                  onClick={() => removeParty(index)}
                  disabled={parties.length <= 2}
                  aria-label={`Remove party ${index + 1}`}
                  className="self-end rounded-md p-2 text-red-600 hover:bg-red-50 disabled:opacity-50 dark:text-red-400 dark:hover:bg-red-950"
                >
                  <Trash2 aria-hidden />
                </button>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              onClick={() => appendParty({ name: "", address: "", role: "contractor" })}
              disabled={parties.length >= 10}
            >
              <Plus aria-hidden />
              Add party
            </Button>
          </section>
        )}

        {stepIndex === 1 && (
          <section aria-labelledby="contract-terms-heading" className="space-y-4">
            <h2 id="contract-terms-heading" className="text-xl font-semibold">
              Terms
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label htmlFor="contract-title" className="mb-1 block text-sm font-medium">
                  Contract title
                </label>
                <Input
                  id="contract-title"
                  aria-invalid={Boolean(errors.title)}
                  {...register("title")}
                />
                <FieldError id="contract-title-error" message={errors.title?.message} />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="contract-description" className="mb-1 block text-sm font-medium">
                  Description
                </label>
                <textarea
                  id="contract-description"
                  rows={3}
                  className="w-full rounded-md border border-input bg-transparent p-3 text-sm shadow-xs"
                  {...register("description")}
                />
                <FieldError
                  id="contract-description-error"
                  message={errors.description?.message}
                />
              </div>
              <div>
                <label htmlFor="contract-currency" className="mb-1 block text-sm font-medium">
                  Currency
                </label>
                <Input
                  id="contract-currency"
                  maxLength={3}
                  aria-invalid={Boolean(errors.currency)}
                  {...register("currency")}
                />
                <FieldError
                  id="contract-currency-error"
                  message={errors.currency?.message}
                />
              </div>
              <div>
                <label htmlFor="contract-total" className="mb-1 block text-sm font-medium">
                  Total amount
                </label>
                <Input
                  id="contract-total"
                  inputMode="decimal"
                  aria-invalid={Boolean(errors.totalAmount)}
                  {...register("totalAmount")}
                />
                <FieldError
                  id="contract-total-error"
                  message={errors.totalAmount?.message}
                />
              </div>
              <div>
                <label
                  htmlFor="release-condition"
                  className="mb-1 block text-sm font-medium"
                >
                  Release condition
                </label>
                <select
                  id="release-condition"
                  className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs"
                  {...register("releaseCondition")}
                >
                  {Object.entries(RELEASE_CONDITION_LABELS).map(
                    ([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ),
                  )}
                </select>
              </div>
            </div>

            <label className="flex items-center gap-2 text-sm font-medium">
              <input
                type="checkbox"
                checked={hasSchedule}
                onChange={(event) => handleScheduleToggle(event.target.checked)}
                className="size-4"
              />
              Add a payment schedule
            </label>
            {hasSchedule && (
              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <label htmlFor="schedule-start" className="mb-1 block text-sm font-medium">
                    Start date
                  </label>
                  <Input id="schedule-start" type="date" {...register("schedule.startDate")} />
                  <FieldError
                    id="schedule-start-error"
                    message={errors.schedule?.startDate?.message}
                  />
                </div>
                <div>
                  <label htmlFor="schedule-end" className="mb-1 block text-sm font-medium">
                    End date
                  </label>
                  <Input id="schedule-end" type="date" {...register("schedule.endDate")} />
                  <FieldError
                    id="schedule-end-error"
                    message={errors.schedule?.endDate?.message}
                  />
                </div>
                <div>
                  <label htmlFor="schedule-interval" className="mb-1 block text-sm font-medium">
                    Interval
                  </label>
                  <select
                    id="schedule-interval"
                    className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs"
                    {...register("schedule.interval")}
                  >
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                </div>
                <FieldError id="schedule-error" message={errors.schedule?.message} />
              </div>
            )}
          </section>
        )}

        {stepIndex === 2 && (
          <section aria-labelledby="contract-milestones-heading" className="space-y-4">
            <h2 id="contract-milestones-heading" className="text-xl font-semibold">
              Milestones
            </h2>
            <FieldError id="milestones-error" message={errors.milestones?.message} />
            {milestones.map((milestone, index) => (
              <div
                key={milestone.id}
                className="grid gap-3 rounded-xl border border-zinc-200 p-4 dark:border-zinc-800 sm:grid-cols-[1.4fr_1fr_1fr_auto]"
              >
                <div>
                  <label
                    htmlFor={`milestone-title-${index}`}
                    className="mb-1 block text-sm font-medium"
                  >
                    Milestone title
                  </label>
                  <Input
                    id={`milestone-title-${index}`}
                    aria-invalid={Boolean(errors.milestones?.[index]?.title)}
                    {...register(`milestones.${index}.title`)}
                  />
                  <FieldError
                    id={`milestone-title-${index}-error`}
                    message={errors.milestones?.[index]?.title?.message}
                  />
                </div>
                <div>
                  <label
                    htmlFor={`milestone-amount-${index}`}
                    className="mb-1 block text-sm font-medium"
                  >
                    Amount
                  </label>
                  <Input
                    id={`milestone-amount-${index}`}
                    inputMode="decimal"
                    aria-invalid={Boolean(errors.milestones?.[index]?.amount)}
                    {...register(`milestones.${index}.amount`)}
                  />
                  <FieldError
                    id={`milestone-amount-${index}-error`}
                    message={errors.milestones?.[index]?.amount?.message}
                  />
                </div>
                <div>
                  <label
                    htmlFor={`milestone-due-${index}`}
                    className="mb-1 block text-sm font-medium"
                  >
                    Due date (optional)
                  </label>
                  <Input
                    id={`milestone-due-${index}`}
                    type="date"
                    {...register(`milestones.${index}.dueDate`)}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removeMilestone(index)}
                  disabled={milestones.length <= 1}
                  aria-label={`Remove milestone ${index + 1}`}
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
                appendMilestone({
                  id: makeMilestoneId(),
                  title: "",
                  amount: "0.00",
                  dueDate: "",
                })
              }
              disabled={milestones.length >= 100}
            >
              <Plus aria-hidden />
              Add milestone
            </Button>

            <div className="rounded-xl bg-zinc-50 p-5 dark:bg-zinc-900">
              <h3 className="text-sm font-semibold">Milestone total</h3>
              <dl className="mt-2 space-y-1 text-sm" aria-live="polite">
                <div className="flex justify-between">
                  <dt>Contract total</dt>
                  <dd className="tabular-nums">
                    {values.currency || "USD"} {formatMinorUnits(totalMinorUnits)}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt>Milestones sum</dt>
                  <dd
                    data-testid="milestone-sum"
                    className={cn(
                      "tabular-nums",
                      totalMismatch && "font-semibold text-red-600 dark:text-red-400",
                    )}
                  >
                    {values.currency || "USD"} {formatMinorUnits(milestoneSum)}
                  </dd>
                </div>
              </dl>
              {totalMismatch && (
                <p role="alert" className="mt-3 text-sm font-medium text-red-600 dark:text-red-400">
                  Milestone amounts must add up to the contract total.
                </p>
              )}
            </div>
          </section>
        )}

        {stepIndex === 3 && (
          <section aria-labelledby="contract-review-heading" className="space-y-6">
            <h2 id="contract-review-heading" className="text-xl font-semibold">
              Review
            </h2>
            <div className="rounded-xl border border-zinc-200 p-5 dark:border-zinc-800">
              <h3 className="font-semibold">{values.title}</h3>
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                {values.description || "No description"}
              </p>
              <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-zinc-500">Total</dt>
                  <dd className="font-medium tabular-nums">
                    {values.currency} {formatMinorUnits(totalMinorUnits)}
                  </dd>
                </div>
                <div>
                  <dt className="text-zinc-500">Release condition</dt>
                  <dd className="font-medium">
                    {RELEASE_CONDITION_LABELS[values.releaseCondition]}
                  </dd>
                </div>
                {values.schedule && (
                  <div className="sm:col-span-2">
                    <dt className="text-zinc-500">Schedule</dt>
                    <dd className="font-medium">
                      {values.schedule.startDate} to {values.schedule.endDate} (
                      {values.schedule.interval})
                    </dd>
                  </div>
                )}
              </dl>
            </div>

            <div className="rounded-xl border border-zinc-200 p-5 dark:border-zinc-800">
              <h3 className="font-semibold">Parties</h3>
              <ul className="mt-3 space-y-2 text-sm">
                {values.parties.map((party, index) => (
                  <li key={`${party.address}-${index}`}>
                    <span className="font-medium">{party.name}</span> — {party.role},{" "}
                    <span className="text-zinc-500">{party.address}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
              <table className="w-full text-left text-sm">
                <caption className="sr-only">Contract milestones</caption>
                <thead className="bg-zinc-50 text-xs uppercase text-zinc-500 dark:bg-zinc-900">
                  <tr>
                    <th scope="col" className="px-4 py-2">Milestone</th>
                    <th scope="col" className="px-4 py-2">Due date</th>
                    <th scope="col" className="px-4 py-2 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {values.milestones.map((milestone, index) => (
                    <tr key={milestone.id || index}>
                      <td className="px-4 py-2">{milestone.title}</td>
                      <td className="px-4 py-2">{milestone.dueDate || "—"}</td>
                      <td className="px-4 py-2 text-right tabular-nums">
                        {formatMinorUnits(
                          parseMoneyToMinorUnits(milestone.amount) ?? 0,
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        <div className="flex flex-wrap items-center gap-3">
          {stepIndex > 0 && (
            <Button type="button" variant="outline" onClick={handleBack}>
              Back
            </Button>
          )}
          {stepIndex < STEPS.length - 1 ? (
            <Button
              type="button"
              onClick={() => void handleNext()}
              disabled={stepIndex === 2 && totalMismatch}
            >
              Continue
            </Button>
          ) : (
            <Button type="submit">Create draft contract</Button>
          )}
          <Button type="button" variant="ghost" asChild>
            <Link href="/contracts">Cancel</Link>
          </Button>
        </div>
      </form>
    </main>
  );
}
