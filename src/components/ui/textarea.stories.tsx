import type { Meta, StoryObj } from "@storybook/react-vite"
import { expect, userEvent, within } from "storybook/test"

import { Textarea } from "./textarea"

const meta = {
  title: "UI/Form/Textarea",
  component: Textarea,
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
  },
  args: {
    placeholder: "Add details...",
    rows: 4,
  },
} satisfies Meta<typeof Textarea>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const Disabled: Story = {
  args: {
    disabled: true,
    value: "This value is read-only.",
  },
}

export const Invalid: Story = {
  args: {
    "aria-invalid": true,
    value: "Missing required details",
  },
}

export const InteractiveTyping: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const textarea = canvas.getByPlaceholderText("Add details...")
    await userEvent.type(textarea, "A short note.")
    await expect(textarea).toHaveValue("A short note.")
  },
}
