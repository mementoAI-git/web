import type { Meta, StoryObj } from "@storybook/react-vite"
import { MemoryRouter } from "react-router-dom"

import { Button as LegacyButton } from "@/components/Buttons"
import { Button as UiButton } from "@/components/ui/button"

const meta = {
  title: "Foundations/Button Comparison",
  parameters: {
    layout: "padded",
  },
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

export const LegacyVsUi: Story = {
  render: () => (
    <MemoryRouter>
      <div className="grid gap-8 md:grid-cols-2">
        <section className="space-y-3 rounded-xl border border-border bg-card p-4">
          <h3 className="text-base font-semibold">Legacy Button (`components/Buttons`)</h3>
          <div className="space-y-2">
            <LegacyButton title="Continue" />
            <LegacyButton title="Saving" loading />
            <LegacyButton title="Disabled" disabled />
          </div>
        </section>

        <section className="space-y-3 rounded-xl border border-border bg-card p-4">
          <h3 className="text-base font-semibold">UI Button (`components/ui/button`)</h3>
          <div className="flex flex-wrap items-center gap-2">
            <UiButton>Continue</UiButton>
            <UiButton variant="secondary">Secondary</UiButton>
            <UiButton variant="outline">Outline</UiButton>
            <UiButton variant="destructive">Delete</UiButton>
            <UiButton disabled>Disabled</UiButton>
          </div>
        </section>
      </div>
    </MemoryRouter>
  ),
}
