import type { Meta, StoryObj } from "@storybook/react-vite"
import { expect, userEvent, within } from "storybook/test"

import { Input } from "./input"

const meta = {
  title: "UI/Form/Input",
  component: Input,
  tags: ["autodocs"],
  parameters: {
    layout: "padded",
  },
  args: {
    placeholder: "name@example.com",
    type: "email",
  },
} satisfies Meta<typeof Input>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const Disabled: Story = {
  args: {
    disabled: true,
    value: "disabled@example.com",
  },
}

export const Invalid: Story = {
  args: {
    "aria-invalid": true,
    value: "invalid-email",
  },
}

export const InteractiveTyping: Story = {
  args: {
    placeholder: "Type your email",
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const input = canvas.getByPlaceholderText("Type your email")
    await userEvent.type(input, "jane@example.com")
    await expect(input).toHaveValue("jane@example.com")
  },
}
