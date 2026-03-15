import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { OnboardingStep1 } from "./OnboardingStep1";

describe("OnboardingStep1", () => {
  it("renders name input and archetype cards", () => {
    render(
      <OnboardingStep1
        displayName=""
        onDisplayNameChange={() => {}}
        hostArchetype={null}
        onArchetypeSelect={() => {}}
        hostArchetypeFreetext=""
        onArchetypeFreetextChange={() => {}}
      />
    );
    expect(screen.getByLabelText(/your name/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/eleanor, jamie/i)).toBeInTheDocument();
    expect(screen.getByText(/preserving memories for my family/i)).toBeInTheDocument();
  });

  it("shows validation error for displayName when provided", () => {
    render(
      <OnboardingStep1
        displayName=""
        onDisplayNameChange={() => {}}
        hostArchetype={null}
        onArchetypeSelect={() => {}}
        hostArchetypeFreetext=""
        onArchetypeFreetextChange={() => {}}
        validationErrors={{ displayName: "We'd love to know what to call you." }}
      />
    );
    expect(screen.getByText(/we'd love to know what to call you/i)).toBeInTheDocument();
  });

  it("shows validation error for archetype when provided", () => {
    render(
      <OnboardingStep1
        displayName="Jane"
        onDisplayNameChange={() => {}}
        hostArchetype={null}
        onArchetypeSelect={() => {}}
        hostArchetypeFreetext=""
        onArchetypeFreetextChange={() => {}}
        validationErrors={{ archetype: "Please pick the option that fits best." }}
      />
    );
    expect(screen.getByText(/please pick the option that fits best/i)).toBeInTheDocument();
  });

  it("shows other textarea when archetype is other", () => {
    render(
      <OnboardingStep1
        displayName="Jane"
        onDisplayNameChange={() => {}}
        hostArchetype="other"
        onArchetypeSelect={() => {}}
        hostArchetypeFreetext=""
        onArchetypeFreetextChange={() => {}}
      />
    );
    expect(screen.getByLabelText(/tell us a little about why you're here/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/no pressure/i)).toBeInTheDocument();
  });

  it("does not show other textarea when archetype is not other", () => {
    render(
      <OnboardingStep1
        displayName="Jane"
        onDisplayNameChange={() => {}}
        hostArchetype="family"
        onArchetypeSelect={() => {}}
        hostArchetypeFreetext=""
        onArchetypeFreetextChange={() => {}}
      />
    );
    expect(screen.queryByLabelText(/tell us a little about why you're here/i)).not.toBeInTheDocument();
  });

  it("calls onDisplayNameChange when name input changes", async () => {
    const user = userEvent.setup();
    const onDisplayNameChange = vi.fn();
    render(
      <OnboardingStep1
        displayName=""
        onDisplayNameChange={onDisplayNameChange}
        hostArchetype={null}
        onArchetypeSelect={() => {}}
        hostArchetypeFreetext=""
        onArchetypeFreetextChange={() => {}}
      />
    );
    await user.type(screen.getByPlaceholderText(/eleanor, jamie/i), "Jane");
    expect(onDisplayNameChange).toHaveBeenCalled();
  });

  it("calls onArchetypeSelect when card is clicked", async () => {
    const user = userEvent.setup();
    const onArchetypeSelect = vi.fn();
    render(
      <OnboardingStep1
        displayName=""
        onDisplayNameChange={() => {}}
        hostArchetype={null}
        onArchetypeSelect={onArchetypeSelect}
        hostArchetypeFreetext=""
        onArchetypeFreetextChange={() => {}}
      />
    );
    await user.click(screen.getByRole("button", { name: /preserving memories for my family/i }));
    expect(onArchetypeSelect).toHaveBeenCalledWith("family");
  });
});
