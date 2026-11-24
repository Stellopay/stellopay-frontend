import { act, fireEvent, render, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import React, { useState } from "react";

import {
  DirtyGuardProvider,
  useDirtyGuard as useDirtyGuardContext,
} from "@/context/dirty-guard-context";
import { useDirtyGuard } from "@/hooks/useDirtyGuard";

function wrapper({ children }: { children: React.ReactNode }) {
  return <DirtyGuardProvider>{children}</DirtyGuardProvider>;
}

function DirtySource() {
  useDirtyGuard(true);
  return null;
}

function CleanupHarness() {
  const [isMounted, setIsMounted] = useState(true);
  const { isDirty } = useDirtyGuardContext();

  return (
    <>
      <span>{isDirty ? "dirty" : "clean"}</span>
      <button onClick={() => setIsMounted(false)}>Unmount source</button>
      {isMounted && <DirtySource />}
    </>
  );
}

describe("useDirtyGuard", () => {
  it("registers the boolean source and removes it on cleanup", () => {
    const { result, rerender, unmount } = renderHook(
      ({ isDirty }) => {
        useDirtyGuard(isDirty);
        return useDirtyGuardContext();
      },
      { initialProps: { isDirty: false }, wrapper },
    );

    expect(result.current.isDirty).toBe(false);

    rerender({ isDirty: true });
    expect(result.current.isDirty).toBe(true);

    rerender({ isDirty: false });
    expect(result.current.isDirty).toBe(false);

    rerender({ isDirty: true });
    expect(result.current.isDirty).toBe(true);
    act(() => unmount());
  });

  it("removes its source when the registering component unmounts", () => {
    const { getByText } = render(
      <DirtyGuardProvider>
        <CleanupHarness />
      </DirtyGuardProvider>,
    );

    expect(getByText("dirty")).toBeTruthy();
    fireEvent.click(getByText("Unmount source"));
    expect(getByText("clean")).toBeTruthy();
  });
});
