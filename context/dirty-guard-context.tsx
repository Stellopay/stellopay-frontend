"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

interface DirtyGuardContextValue {
  isDirty: boolean;
  confirmNavigation: () => boolean;
  registerDirtySource: (sourceId: string, isDirty: boolean) => () => void;
}

const DirtyGuardContext = createContext<DirtyGuardContextValue | undefined>(
  undefined,
);

const DISCARD_WARNING =
  "You have unsaved changes. Discard them and continue?";

export function DirtyGuardProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const dirtySourcesRef = useRef(new Map<string, boolean>());
  const [isDirty, setIsDirty] = useState(false);

  const updateDirtyState = useCallback(() => {
    setIsDirty(Array.from(dirtySourcesRef.current.values()).some(Boolean));
  }, []);

  const registerDirtySource = useCallback(
    (sourceId: string, sourceIsDirty: boolean) => {
      dirtySourcesRef.current.set(sourceId, sourceIsDirty);
      updateDirtyState();
      return () => {
        dirtySourcesRef.current.delete(sourceId);
        updateDirtyState();
      };
    },
    [updateDirtyState],
  );

  const confirmNavigation = useCallback(() => {
    if (!Array.from(dirtySourcesRef.current.values()).some(Boolean)) return true;
    if (typeof window === "undefined") return true;
    return window.confirm(DISCARD_WARNING);
  }, []);

  const value = useMemo(
    () => ({ isDirty, confirmNavigation, registerDirtySource }),
    [isDirty, confirmNavigation, registerDirtySource],
  );

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!Array.from(dirtySourcesRef.current.values()).some(Boolean)) return;
      event.preventDefault();
      event.returnValue = "";
    };

    const handleClick = (event: MouseEvent) => {
      if (
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey
      ) {
        return;
      }

      const target = event.target;
      if (!(target instanceof Element)) return;
      const anchor = target.closest("a[href]") as HTMLAnchorElement | null;
      if (!anchor) return;
      if (anchor.target === "_blank" || anchor.hasAttribute("download")) return;

      const href = anchor.getAttribute("href");
      if (
        !href ||
        href.startsWith("#") ||
        href.startsWith("javascript:") ||
        href.startsWith("mailto:") ||
        href.startsWith("tel:")
      ) {
        return;
      }

      if (!confirmNavigation()) {
        event.preventDefault();
        event.stopPropagation();
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    document.addEventListener("click", handleClick, true);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      document.removeEventListener("click", handleClick, true);
    };
  }, [confirmNavigation]);

  return (
    <DirtyGuardContext.Provider value={value}>
      {children}
    </DirtyGuardContext.Provider>
  );
}

export function useDirtyGuard(): DirtyGuardContextValue {
  const context = useContext(DirtyGuardContext);
  if (!context) {
    throw new Error(
      "useDirtyGuard must be used within a DirtyGuardProvider.",
    );
  }
  return context;
}
