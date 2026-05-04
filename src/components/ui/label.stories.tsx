import type { Meta, StoryObj } from "@storybook/react-vite"

import { Input } from "./input"
import { Label } from "./label"

const meta = {
  title: "UI/Form/Label",
  component: Label,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
  },
  args: {
    children: "Email address",
    htmlFor: "story-email",
  },
} satisfies Meta<typeof Label>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: (args) => (
    <div className="grid w-72 gap-2">
      <Label {...args} />
      <Input id="story-email" placeholder="name@example.com" />
    </div>
  ),
}

export const DisabledField: Story = {
  render: (args) => (
    <div className="grid w-72 gap-2">
      <Label {...args} />
      <Input id="story-email" disabled value="disabled@example.com" />
    </div>
  ),
}
