import type { Meta, StoryObj } from "@storybook/react-vite"
import { expect, userEvent, within } from "storybook/test"

import { Label } from "./label"
import { Switch } from "./switch"

const meta = {
  title: "UI/Form/Switch",
  component: Switch,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
  },
  args: {
    "aria-label": "Enable notifications",
    size: "default",
  },
  argTypes: {
    size: {
      control: "select",
      options: ["sm", "default"],
    },
  },
} satisfies Meta<typeof Switch>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const Checked: Story = {
  args: {
    checked: true,
  },
}

export const Small: Story = {
  args: {
    size: "sm",
  },
}

export const WithLabel: Story = {
  render: (args) => (
    <div className="flex items-center gap-2">
      <Switch id="notifications" {...args} />
      <Label htmlFor="notifications">Enable notifications</Label>
    </div>
  ),
}

export const InteractiveToggle: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const toggle = canvas.getByRole("switch", { name: "Enable notifications" })
    await userEvent.click(toggle)
    await expect(toggle).toBeChecked()
  },
}
