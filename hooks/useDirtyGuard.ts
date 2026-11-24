import { useUnsavedChangesGuard } from "./useUnsavedChangesGuard";

export function useDirtyGuard(isDirty: boolean) {
  return useUnsavedChangesGuard(isDirty);
}
