import type { Meta, StoryObj } from "@storybook/react-vite"
import { expect, userEvent, within } from "storybook/test"

import { Label } from "./label"
import { Checkbox } from "./checkbox"

const meta = {
  title: "UI/Form/Checkbox",
  component: Checkbox,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
  },
  args: {
    "aria-label": "Accept terms",
  },
} satisfies Meta<typeof Checkbox>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const Checked: Story = {
  args: {
    checked: true,
  },
}

export const Disabled: Story = {
  args: {
    disabled: true,
  },
}

export const WithLabel: Story = {
  render: (args) => (
    <div className="flex items-center gap-2">
      <Checkbox id="terms" {...args} />
      <Label htmlFor="terms">Accept terms</Label>
    </div>
  ),
}

export const InteractiveToggle: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const checkbox = canvas.getByRole("checkbox", { name: "Accept terms" })
    await userEvent.click(checkbox)
    await expect(checkbox).toBeChecked()
  },
}
