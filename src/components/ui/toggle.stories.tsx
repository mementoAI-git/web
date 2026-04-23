import type { Meta, StoryObj } from "@storybook/react-vite"
import { expect, userEvent, within } from "storybook/test"

import { Toggle } from "./toggle"

const meta = {
  title: "UI/Form/Toggle",
  id: "ui-toggle",
  component: Toggle,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
  },
  args: {
    "aria-label": "Toggle bold",
    children: "Bold",
    variant: "default",
    size: "default",
  },
  argTypes: {
    variant: {
      control: "select",
      options: ["default", "outline"],
    },
    size: {
      control: "select",
      options: ["default", "sm", "lg"],
    },
  },
} satisfies Meta<typeof Toggle>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const Outline: Story = {
  args: {
    variant: "outline",
  },
}

export const Pressed: Story = {
  args: {
    pressed: true,
  },
}

export const InteractiveToggle: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const toggle = canvas.getByRole("button", { name: "Toggle bold" })
    await userEvent.click(toggle)
    await expect(toggle).toHaveAttribute("aria-pressed", "true")
  },
}
