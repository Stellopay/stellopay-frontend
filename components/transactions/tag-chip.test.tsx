import { render, screen, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { axe } from "vitest-axe";
import type { Tag } from "@/types/transaction";
import { TagChip } from "./tag-chip";

const assignedTag: Tag = {
  id: "tag-1",
  name: "Travel",
  color: "#2563eb",
};

function renderTagChip(assignedTags: Tag[] = []) {
  return render(
    <TagChip
      assignedTags={assignedTags}
      allTags={assignedTags}
      onAssign={vi.fn()}
      onUnassign={vi.fn()}
      onCreateTag={() => assignedTag}
      transactionId="tx-1"
    />,
  );
}

describe("TagChip", () => {
  it("renders the assigned tag label and its colour", () => {
    renderTagChip([assignedTag]);

    const label = screen.getByText("Travel");
    const chip = label.parentElement;
    expect(chip).toHaveStyle({
      backgroundColor: `${assignedTag.color}20`,
      color: assignedTag.color,
    });
  });

  it("names the remove button and calls onUnassign with the tag id", () => {
    const onUnassign = vi.fn();
    render(
      <TagChip
        assignedTags={[assignedTag]}
        allTags={[assignedTag]}
        onAssign={vi.fn()}
        onUnassign={onUnassign}
        onCreateTag={() => assignedTag}
        transactionId="tx-1"
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Remove tag Travel" }));
    expect(onUnassign).toHaveBeenCalledWith("tag-1");
    expect(onUnassign).toHaveBeenCalledTimes(1);
  });

  it("passes axe accessibility audit on the default render", async () => {
    const { container } = renderTagChip();
    expect((await axe(container)).violations).toHaveLength(0);
  });
});
