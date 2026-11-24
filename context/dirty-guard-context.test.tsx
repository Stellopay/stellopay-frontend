import { act, fireEvent, render, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import React from "react";

import {
  DirtyGuardProvider,
  useDirtyGuard,
} from "@/context/dirty-guard-context";
import { useDirtyGuard as useRegisterDirtyGuard } from "@/hooks/useDirtyGuard";

function wrapper({ children }: { children: React.ReactNode }) {
  return <DirtyGuardProvider>{children}</DirtyGuardProvider>;
}

function DirtyAnchor() {
  useRegisterDirtyGuard(true);
  return (
    <a href="/next">
      <span>Next</span>
    </a>
  );
}

function DirtyBlankAnchor() {
  useRegisterDirtyGuard(true);
  return (
    <a href="/next" target="_blank">
      Next
    </a>
  );
}

describe("DirtyGuardProvider", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("reports dirty sources and honors accept and reject decisions", () => {
    const { result } = renderHook(() => useDirtyGuard(), { wrapper });
    let unregister = () => {};
    act(() => {
      unregister = result.current.registerDirtySource("form", true);
    });

    expect(result.current.isDirty).toBe(true);

    vi.spyOn(window, "confirm").mockReturnValue(false);
    expect(result.current.confirmNavigation()).toBe(false);
    vi.mocked(window.confirm).mockReturnValue(true);
    expect(result.current.confirmNavigation()).toBe(true);

    act(() => unregister());
    expect(result.current.isDirty).toBe(false);
    expect(result.current.confirmNavigation()).toBe(true);
  });

  it("blocks dirty same-tab anchor navigation when discard is rejected", () => {
    vi.spyOn(window, "confirm").mockReturnValue(false);

    const { container } = render(
      <DirtyGuardProvider>
        <DirtyAnchor />
      </DirtyGuardProvider>,
    );
    const click = new MouseEvent("click", {
      bubbles: true,
      cancelable: true,
      button: 0,
    });
    container.querySelector("span")!.dispatchEvent(click);

    expect(click.defaultPrevented).toBe(true);
    expect(window.confirm).toHaveBeenCalledOnce();
  });

  it("allows anchors that open a new tab without prompting", () => {
    const confirm = vi.spyOn(window, "confirm");
    const { getByText } = render(
      <DirtyGuardProvider>
        <DirtyBlankAnchor />
      </DirtyGuardProvider>,
    );

    fireEvent.click(getByText("Next"));

    expect(confirm).not.toHaveBeenCalled();
  });
});
