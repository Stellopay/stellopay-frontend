"use client";

import React, { useState, useMemo, useRef } from "react";
import {
  Plus,
  Download,
  Upload,
  Copy,
  Check,
  Pencil,
  Trash2,
  Users,
  AlertCircle,
  Tag as TagIcon,
  Mail,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SearchBar } from "@/components/common/search-bar";
import {
  useRecipients,
  type Recipient,
  type RecipientInput,
  exportRecipientsToCsv,
} from "@/lib/recipients-store";
import { truncateStellarAddress, isValidStellarAddress } from "@/utils/stellarAddress";
import { copyToClipboard } from "@/utils/clipboardUtils";
import { downloadCsvContent } from "@/utils/csvUtils";

export default function RecipientsPage() {
  const {
    recipients,
    addRecipient,
    updateRecipient,
    deleteRecipient,
    importRecipientsFromCsv,
  } = useRecipients();

  const [searchQuery, setSearchQuery] = useState("");
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);

  // Dialog State
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  const [editingRecipient, setEditingRecipient] = useState<Recipient | null>(null);

  // Form Fields
  const [formName, setFormName] = useState("");
  const [formAddress, setFormAddress] = useState("");
  const [formMemo, setFormMemo] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formTags, setFormTags] = useState("");
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Delete Confirmation Dialog State
  const [deletingRecipient, setDeletingRecipient] = useState<Recipient | null>(null);
  const [deleteConfirmationText, setDeleteConfirmationText] = useState("");
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // CSV Import State
  const [importNotification, setImportNotification] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Filtered Recipients based on search
  const filteredRecipients = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return recipients;
    return recipients.filter((r) => {
      const matchName = r.name.toLowerCase().includes(query);
      const matchAddress = r.address.toLowerCase().includes(query);
      const matchMemo = r.memo?.toLowerCase().includes(query) ?? false;
      const matchEmail = r.email?.toLowerCase().includes(query) ?? false;
      const matchTags = r.tags?.some((t) => t.toLowerCase().includes(query)) ?? false;
      return matchName || matchAddress || matchMemo || matchEmail || matchTags;
    });
  }, [recipients, searchQuery]);

  // Handle Copy Address
  const handleCopy = async (address: string) => {
    const success = await copyToClipboard(address);
    if (success) {
      setCopiedAddress(address);
      setTimeout(() => setCopiedAddress(null), 2000);
    }
  };

  // Open Add Dialog
  const handleOpenAdd = () => {
    setEditingRecipient(null);
    setFormName("");
    setFormAddress("");
    setFormMemo("");
    setFormEmail("");
    setFormTags("");
    setFormErrors({});
    setIsFormDialogOpen(true);
  };

  // Open Edit Dialog
  const handleOpenEdit = (recipient: Recipient) => {
    setEditingRecipient(recipient);
    setFormName(recipient.name);
    setFormAddress(recipient.address);
    setFormMemo(recipient.memo || "");
    setFormEmail(recipient.email || "");
    setFormTags((recipient.tags || []).join(", "));
    setFormErrors({});
    setIsFormDialogOpen(true);
  };

  // Validate and Save Recipient
  const handleSaveRecipient = (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};

    const trimmedName = formName.trim();
    if (!trimmedName) {
      errors.name = "Name is required";
    }

    const trimmedAddress = formAddress.trim().toUpperCase();
    if (!trimmedAddress) {
      errors.address = "Stellar address is required";
    } else if (!isValidStellarAddress(trimmedAddress)) {
      errors.address =
        "Enter a valid Stellar address (public G... or muxed M...). Secret keys are not allowed.";
    } else {
      // Duplicate check
      const duplicate = recipients.find(
        (r) =>
          r.address.toUpperCase() === trimmedAddress &&
          (!editingRecipient || r.id !== editingRecipient.id),
      );
      if (duplicate) {
        errors.address = "A recipient with this Stellar address already exists";
      }
    }

    const trimmedEmail = formEmail.trim();
    if (trimmedEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      errors.email = "Enter a valid email address";
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    const tagsArray = formTags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    const inputData: RecipientInput = {
      name: trimmedName,
      address: trimmedAddress,
      memo: formMemo.trim() || undefined,
      email: trimmedEmail || undefined,
      tags: tagsArray,
    };

    try {
      if (editingRecipient) {
        updateRecipient(editingRecipient.id, inputData);
      } else {
        addRecipient(inputData);
      }
      setIsFormDialogOpen(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to save recipient";
      setFormErrors({ general: msg });
    }
  };

  // Handle Delete Confirmation
  const handleConfirmDelete = () => {
    if (!deletingRecipient) return;
    if (deleteConfirmationText !== deletingRecipient.name) {
      setDeleteError(`Type "${deletingRecipient.name}" exactly to confirm.`);
      return;
    }

    try {
      deleteRecipient(deletingRecipient.id);
      setDeletingRecipient(null);
      setDeleteConfirmationText("");
      setDeleteError(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to delete recipient";
      setDeleteError(msg);
    }
  };

  // Handle Export CSV
  const handleExportCsv = () => {
    const csvContent = exportRecipientsToCsv(recipients);
    downloadCsvContent("stellopay-recipients.csv", csvContent);
  };

  // Handle Import CSV file selection
  const handleImportFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) return;
      const res = importRecipientsFromCsv(text);
      if (res.errors.length > 0) {
        setImportNotification({
          type: res.imported.length > 0 ? "success" : "error",
          message: `Imported ${res.imported.length} recipient(s). ${res.errors.length} row(s) had errors: ${res.errors[0].error}`,
        });
      } else {
        setImportNotification({
          type: "success",
          message: `Successfully imported ${res.imported.length} recipient(s).`,
        });
      }
      setTimeout(() => setImportNotification(null), 6000);
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  return (
    <div className="w-full min-h-screen bg-zinc-50/50 dark:bg-[#0D0D0D] p-6 lg:p-10">
      <div className="max-w-[1400px] mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-white flex items-center gap-2">
              <Users className="h-7 w-7 text-primary" />
              Recipients
            </h1>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              Manage, search and tag saved Stellar payees for quick and safe transfers.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <input
              type="file"
              ref={fileInputRef}
              accept=".csv"
              className="hidden"
              onChange={handleImportFileChange}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              className="gap-2"
              title="Import recipients from CSV"
            >
              <Upload className="h-4 w-4" />
              Import CSV
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCsv}
              disabled={recipients.length === 0}
              className="gap-2"
              title="Export recipients to CSV"
            >
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
            <Button
              size="sm"
              onClick={handleOpenAdd}
              className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Plus className="h-4 w-4" />
              Add Recipient
            </Button>
          </div>
        </div>

        {/* Import Notification Banner */}
        {importNotification && (
          <div
            role="status"
            className={`p-4 rounded-xl border text-sm flex items-center justify-between ${
              importNotification.type === "success"
                ? "bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-200"
                : "bg-red-50 border-red-200 text-red-800 dark:bg-red-950/40 dark:border-red-800 dark:text-red-200"
            }`}
          >
            <span>{importNotification.message}</span>
            <button
              onClick={() => setImportNotification(null)}
              className="font-semibold text-xs ml-4 underline hover:no-underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Toolbar & Search */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="w-full sm:w-96">
            <SearchBar
              value={searchQuery}
              onSearch={setSearchQuery}
              placeholder="Search recipients by name, address, tag..."
              ariaLabel="Search recipients"
            />
          </div>
          <div className="text-xs text-zinc-500 dark:text-zinc-400 self-end sm:self-center">
            Showing {filteredRecipients.length} of {recipients.length} recipient{recipients.length === 1 ? "" : "s"}
          </div>
        </div>

        {/* Recipients Table Card */}
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#111111] overflow-hidden shadow-sm">
          {filteredRecipients.length === 0 ? (
            <div className="p-12 text-center space-y-4">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-zinc-400">
                <Users className="h-7 w-7" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-semibold text-zinc-900 dark:text-white">
                  {searchQuery ? "No recipients match your search" : "No saved recipients yet"}
                </h3>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-md mx-auto">
                  {searchQuery
                    ? `No recipients found matching "${searchQuery}". Try a different keyword.`
                    : "Add contacts to quickly transfer Stellar lumens or tokens without entering full addresses every time."}
                </p>
              </div>
              {!searchQuery && (
                <Button onClick={handleOpenAdd} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add Recipient
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm" role="table">
                <thead className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 text-xs uppercase font-medium text-zinc-500 dark:text-zinc-400">
                  <tr>
                    <th scope="col" className="px-6 py-3.5">
                      Name
                    </th>
                    <th scope="col" className="px-6 py-3.5">
                      Stellar Address
                    </th>
                    <th scope="col" className="px-6 py-3.5">
                      Details
                    </th>
                    <th scope="col" className="px-6 py-3.5">
                      Tags
                    </th>
                    <th scope="col" className="px-6 py-3.5 text-right">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {filteredRecipients.map((recipient) => {
                    const isCopied = copiedAddress === recipient.address;
                    return (
                      <tr
                        key={recipient.id}
                        className="hover:bg-zinc-50/70 dark:hover:bg-zinc-900/30 transition-colors"
                      >
                        {/* Name */}
                        <td className="px-6 py-4 font-semibold text-zinc-900 dark:text-white">
                          {recipient.name}
                        </td>

                        {/* Stellar Address with Truncation & Copy affordance */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <span
                              className="font-mono text-xs text-zinc-600 dark:text-zinc-300"
                              title={recipient.address}
                            >
                              {truncateStellarAddress(recipient.address, 8, 8)}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleCopy(recipient.address)}
                              className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 rounded transition-colors"
                              aria-label={`Copy address for ${recipient.name}`}
                              title={isCopied ? "Copied!" : "Copy address"}
                            >
                              {isCopied ? (
                                <Check className="h-4 w-4 text-emerald-500" />
                              ) : (
                                <Copy className="h-4 w-4" />
                              )}
                            </button>
                          </div>
                        </td>

                        {/* Memo & Email */}
                        <td className="px-6 py-4 text-xs text-zinc-500 dark:text-zinc-400">
                          <div className="space-y-1">
                            {recipient.email && (
                              <div className="flex items-center gap-1.5 text-zinc-600 dark:text-zinc-300">
                                <Mail className="h-3.5 w-3.5 shrink-0 text-zinc-400" />
                                <span className="truncate max-w-[200px]">
                                  {recipient.email}
                                </span>
                              </div>
                            )}
                            {recipient.memo && (
                              <div className="flex items-center gap-1.5 text-zinc-600 dark:text-zinc-300">
                                <FileText className="h-3.5 w-3.5 shrink-0 text-zinc-400" />
                                <span className="truncate max-w-[200px]">
                                  Memo: {recipient.memo}
                                </span>
                              </div>
                            )}
                            {!recipient.email && !recipient.memo && (
                              <span className="text-zinc-400 dark:text-zinc-600">—</span>
                            )}
                          </div>
                        </td>

                        {/* Tags */}
                        <td className="px-6 py-4">
                          {recipient.tags && recipient.tags.length > 0 ? (
                            <div className="flex flex-wrap gap-1.5">
                              {recipient.tags.map((tag) => (
                                <span
                                  key={tag}
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700"
                                >
                                  <TagIcon className="h-2.5 w-2.5" />
                                  {tag}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-zinc-400 dark:text-zinc-600 text-xs">—</span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="px-6 py-4 text-right">
                          <div className="inline-flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOpenEdit(recipient)}
                              aria-label={`Edit ${recipient.name}`}
                              className="h-8 w-8 p-0 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setDeletingRecipient(recipient);
                                setDeleteConfirmationText("");
                                setDeleteError(null);
                              }}
                              aria-label={`Delete ${recipient.name}`}
                              className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Add / Edit Recipient Modal */}
      <Dialog open={isFormDialogOpen} onOpenChange={setIsFormDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <form onSubmit={handleSaveRecipient}>
            <DialogHeader>
              <DialogTitle>
                {editingRecipient ? "Edit Recipient" : "Add Recipient"}
              </DialogTitle>
              <DialogDescription>
                {editingRecipient
                  ? "Update this recipient's name, Stellar address, memo, or tags."
                  : "Enter payee details to save to your local address book."}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {formErrors.general && (
                <div
                  role="alert"
                  className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 text-xs flex items-center gap-2"
                >
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{formErrors.general}</span>
                </div>
              )}

              {/* Name field */}
              <div className="space-y-1.5">
                <Label htmlFor="recipient-name">
                  Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="recipient-name"
                  value={formName}
                  onChange={(e) => {
                    setFormName(e.target.value);
                    if (formErrors.name) setFormErrors((prev) => ({ ...prev, name: "" }));
                  }}
                  placeholder="e.g. Alice Supplier"
                  error={!!formErrors.name}
                  aria-invalid={!!formErrors.name}
                  aria-describedby={formErrors.name ? "name-error" : undefined}
                />
                {formErrors.name && (
                  <p id="name-error" role="alert" className="text-xs text-red-500">
                    {formErrors.name}
                  </p>
                )}
              </div>

              {/* Stellar Address field */}
              <div className="space-y-1.5">
                <Label htmlFor="recipient-address">
                  Stellar Address <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="recipient-address"
                  value={formAddress}
                  onChange={(e) => {
                    setFormAddress(e.target.value);
                    if (formErrors.address) setFormErrors((prev) => ({ ...prev, address: "" }));
                  }}
                  placeholder="G... or M..."
                  error={!!formErrors.address}
                  aria-invalid={!!formErrors.address}
                  aria-describedby={formErrors.address ? "address-error" : undefined}
                />
                {formErrors.address && (
                  <p id="address-error" role="alert" className="text-xs text-red-500">
                    {formErrors.address}
                  </p>
                )}
              </div>

              {/* Memo field */}
              <div className="space-y-1.5">
                <Label htmlFor="recipient-memo">Memo (optional)</Label>
                <Input
                  id="recipient-memo"
                  value={formMemo}
                  onChange={(e) => setFormMemo(e.target.value)}
                  placeholder="e.g. Invoice settlement or Payee ID"
                />
              </div>

              {/* Email field */}
              <div className="space-y-1.5">
                <Label htmlFor="recipient-email">Email (optional)</Label>
                <Input
                  id="recipient-email"
                  type="email"
                  value={formEmail}
                  onChange={(e) => {
                    setFormEmail(e.target.value);
                    if (formErrors.email) setFormErrors((prev) => ({ ...prev, email: "" }));
                  }}
                  placeholder="payee@example.com"
                  error={!!formErrors.email}
                  aria-invalid={!!formErrors.email}
                  aria-describedby={formErrors.email ? "email-error" : undefined}
                />
                {formErrors.email && (
                  <p id="email-error" role="alert" className="text-xs text-red-500">
                    {formErrors.email}
                  </p>
                )}
              </div>

              {/* Tags field */}
              <div className="space-y-1.5">
                <Label htmlFor="recipient-tags">Tags (comma-separated)</Label>
                <Input
                  id="recipient-tags"
                  value={formTags}
                  onChange={(e) => setFormTags(e.target.value)}
                  placeholder="vendor, monthly, utility"
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsFormDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit">
                {editingRecipient ? "Save Changes" : "Save Recipient"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog (Destructive Action Dialog Pattern) */}
      <Dialog
        open={!!deletingRecipient}
        onOpenChange={(open) => {
          if (!open) {
            setDeletingRecipient(null);
            setDeleteConfirmationText("");
            setDeleteError(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-[440px]">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/10 text-red-500 shrink-0">
                <Trash2 className="h-5 w-5" />
              </span>
              <div>
                <DialogTitle>Delete Recipient</DialogTitle>
                <DialogDescription>
                  This action removes {deletingRecipient?.name} from your address book.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-4 py-3">
            <div className="p-3 rounded-xl bg-red-500/5 border border-red-500/10 text-xs text-zinc-600 dark:text-zinc-400 space-y-1">
              <p className="font-semibold text-zinc-900 dark:text-white">
                Before you continue:
              </p>
              <p>
                You will no longer see this recipient in quick transfer suggestions. Existing past transactions will remain unaffected.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="delete-confirm-input" className="text-xs">
                To confirm deletion, type <strong>{deletingRecipient?.name}</strong> below:
              </Label>
              <Input
                id="delete-confirm-input"
                value={deleteConfirmationText}
                onChange={(e) => {
                  setDeleteConfirmationText(e.target.value);
                  if (deleteError) setDeleteError(null);
                }}
                placeholder={deletingRecipient?.name}
                error={!!deleteError}
              />
              {deleteError && (
                <p role="alert" className="text-xs text-red-500">
                  {deleteError}
                </p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeletingRecipient(null);
                setDeleteConfirmationText("");
                setDeleteError(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={deleteConfirmationText !== deletingRecipient?.name}
            >
              Delete Recipient
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
