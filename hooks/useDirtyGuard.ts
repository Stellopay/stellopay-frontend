"use client";

import { useEffect, useId } from "react";
import { useDirtyGuard as useDirtyGuardContext } from "@/context/dirty-guard-context";

export function useDirtyGuard(isDirty: boolean): void {
  const { registerDirtySource } = useDirtyGuardContext();
  const id = useId();

  useEffect(
    () => registerDirtySource(id, isDirty),
    [id, isDirty, registerDirtySource],
  );
}
