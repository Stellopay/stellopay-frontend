import { z } from "zod";
import { parseMoneyToMinorUnits } from "@/utils/moneyUtils";

export const CONTRACT_FIELD_LIMITS = {
  title: 120,
  description: 1000,
  currency: 3,
  name: 120,
  address: 56,
  milestoneTitle: 120,
} as const;

export const CONTRACT_STATUSES = [
  "draft",
  "active",
  "completed",
  "cancelled",
] as const;

export const CONTRACT_ACTIONS = ["activate", "complete", "cancel"] as const;

export const RELEASE_CONDITIONS = [
  "manual",
  "milestone_approval",
  "scheduled",
] as const;

export const PARTY_ROLES = ["client", "contractor"] as const;

export const SCHEDULE_INTERVALS = ["weekly", "monthly"] as const;

export const contractStatusSchema = z.enum(CONTRACT_STATUSES);
export const contractActionSchema = z.enum(CONTRACT_ACTIONS);
export const releaseConditionSchema = z.enum(RELEASE_CONDITIONS);

export type ContractStatus = z.infer<typeof contractStatusSchema>;
export type ContractAction = z.infer<typeof contractActionSchema>;
export type ReleaseCondition = z.infer<typeof releaseConditionSchema>;

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function requiredText(limit: number, label: string) {
  return z
    .string()
    .trim()
    .min(1, `${label} is required.`)
    .max(limit, `Use at most ${limit} characters.`);
}

function dateString(label: string) {
  return z
    .string()
    .regex(DATE_PATTERN, `${label} must be a date in YYYY-MM-DD format.`)
    .refine(
      (value) => !Number.isNaN(Date.parse(value)),
      `Enter a valid ${label.toLowerCase()}.`,
    );
}

function moneyString(label: string) {
  return z.string().refine((value) => parseMoneyToMinorUnits(value) !== null, {
    message: `Enter a non-negative ${label} with at most two decimals.`,
  });
}

export const contractPartySchema = z.object({
  name: requiredText(CONTRACT_FIELD_LIMITS.name, "Party name"),
  address: requiredText(CONTRACT_FIELD_LIMITS.address, "Party address"),
  role: z.enum(PARTY_ROLES),
});

export type ContractParty = z.infer<typeof contractPartySchema>;

export const contractMilestoneSchema = z.object({
  id: z.string().min(1, "Milestone id is required.").max(64),
  title: requiredText(CONTRACT_FIELD_LIMITS.milestoneTitle, "Milestone title"),
  amountMinorUnits: z
    .number()
    .int("Milestone amount must be a whole number of minor units.")
    .positive("Milestone amount must be greater than zero.")
    .max(Number.MAX_SAFE_INTEGER, "Milestone amount is too large."),
  dueDate: dateString("Due date").optional(),
});

export type ContractMilestone = z.infer<typeof contractMilestoneSchema>;

const contractScheduleBaseSchema = z
  .object({
    startDate: dateString("Start date"),
    endDate: dateString("End date"),
    interval: z.enum(SCHEDULE_INTERVALS),
  })
  .refine((value) => value.endDate >= value.startDate, {
    message: "End date cannot be before the start date.",
    path: ["endDate"],
  });

export const contractScheduleSchema = contractScheduleBaseSchema.optional();
export type ContractSchedule = z.infer<typeof contractScheduleSchema>;

export const contractMilestoneFormSchema = contractMilestoneSchema
  .omit({ amountMinorUnits: true })
  .extend({
    amount: moneyString("milestone amount"),
    dueDate: z.union([z.literal(""), dateString("Due date")]).optional(),
  });

export type ContractMilestoneFormValue = z.infer<
  typeof contractMilestoneFormSchema
>;

interface PartyConstraint {
  name: string;
  address: string;
  role: ContractParty["role"];
}

interface MilestoneConstraint {
  id: string;
  amountMinorUnits: number;
}

function refineParties(parties: readonly PartyConstraint[], ctx: z.RefinementCtx) {
  if (
    !parties.some((party) => party.role === "client") ||
    !parties.some((party) => party.role === "contractor")
  ) {
    ctx.addIssue({
      code: "custom",
      path: ["parties"],
      message: "Add at least one client and one contractor.",
    });
  }
  const addresses = parties.map((party) => party.address.trim().toLowerCase());
  if (new Set(addresses).size !== addresses.length) {
    ctx.addIssue({
      code: "custom",
      path: ["parties"],
      message: "Each party address must be unique.",
    });
  }
}

function refineMilestones(
  milestones: readonly MilestoneConstraint[],
  totalAmountMinorUnits: number,
  ctx: z.RefinementCtx,
) {
  const ids = milestones.map((milestone) => milestone.id);
  if (new Set(ids).size !== ids.length) {
    ctx.addIssue({
      code: "custom",
      path: ["milestones"],
      message: "Milestone ids must be unique.",
    });
  }
  const sum = milestones.reduce(
    (total, milestone) => total + milestone.amountMinorUnits,
    0,
  );
  if (sum !== totalAmountMinorUnits) {
    ctx.addIssue({
      code: "custom",
      path: ["milestones"],
      message: "Milestone amounts must add up to the contract total.",
    });
  }
}

const contractDraftBaseSchema = z.object({
  title: requiredText(CONTRACT_FIELD_LIMITS.title, "Contract title"),
  description: z
    .string()
    .trim()
    .max(CONTRACT_FIELD_LIMITS.description, "Description is too long."),
  currency: z
    .string()
    .trim()
    .length(CONTRACT_FIELD_LIMITS.currency, "Currency must be a three-letter code.")
    .regex(/^[A-Z]{3}$/, "Currency must be uppercase (e.g. USD)."),
  totalAmountMinorUnits: z
    .number()
    .int("Total amount must be a whole number of minor units.")
    .positive("Total amount must be greater than zero.")
    .max(Number.MAX_SAFE_INTEGER, "Total amount is too large."),
  parties: z.array(contractPartySchema).min(2, "Add at least two parties.").max(10),
  releaseCondition: releaseConditionSchema,
  schedule: contractScheduleSchema,
  milestones: z
    .array(contractMilestoneSchema)
    .min(1, "Add at least one milestone.")
    .max(100),
});

function refineContract(
  value: {
    parties: readonly PartyConstraint[];
    milestones: readonly MilestoneConstraint[];
    totalAmountMinorUnits: number;
  },
  ctx: z.RefinementCtx,
) {
  refineParties(value.parties, ctx);
  refineMilestones(value.milestones, value.totalAmountMinorUnits, ctx);
}

export const contractDraftSchema = contractDraftBaseSchema.superRefine(
  refineContract,
);
export type ContractDraft = z.infer<typeof contractDraftSchema>;

export const contractSchema = contractDraftBaseSchema
  .extend({
    id: requiredText(64, "Contract id"),
    status: contractStatusSchema,
    createdAt: z.string(),
    updatedAt: z.string(),
  })
  .superRefine(refineContract);
export type Contract = z.infer<typeof contractSchema>;

export const contractWizardSchema = contractDraftBaseSchema
  .omit({
    totalAmountMinorUnits: true,
    milestones: true,
    parties: true,
  })
  .extend({
    totalAmount: moneyString("total amount"),
    parties: z.array(contractPartySchema).min(2, "Add at least two parties.").max(10),
    milestones: z
      .array(contractMilestoneFormSchema)
      .min(1, "Add at least one milestone.")
      .max(100),
  })
  .superRefine((value, ctx) => {
    refineParties(value.parties, ctx);
    refineMilestones(
      value.milestones.map((milestone) => ({
        id: milestone.id,
        amountMinorUnits: parseMoneyToMinorUnits(milestone.amount) ?? 0,
      })),
      parseMoneyToMinorUnits(value.totalAmount) ?? 0,
      ctx,
    );
  });

export type ContractWizardValues = z.infer<typeof contractWizardSchema>;

export function toContractDraft(values: ContractWizardValues): ContractDraft {
  const draft: ContractDraft = {
    title: values.title.trim(),
    description: values.description.trim(),
    currency: values.currency.trim().toUpperCase(),
    totalAmountMinorUnits: parseMoneyToMinorUnits(values.totalAmount) ?? 0,
    parties: values.parties.map((party) => ({
      name: party.name.trim(),
      address: party.address.trim(),
      role: party.role,
    })),
    releaseCondition: values.releaseCondition,
    schedule: values.schedule,
    milestones: values.milestones.map((milestone) => ({
      id: milestone.id,
      title: milestone.title.trim(),
      amountMinorUnits: parseMoneyToMinorUnits(milestone.amount) ?? 0,
      dueDate: milestone.dueDate || undefined,
    })),
  };
  return draft;
}

export function milestoneTotalMinorUnits(
  milestones: readonly { amount: string }[],
): number {
  return milestones.reduce(
    (total, milestone) =>
      total + (parseMoneyToMinorUnits(milestone.amount) ?? 0),
    0,
  );
}
