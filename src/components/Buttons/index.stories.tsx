import type { Meta, StoryObj } from "@storybook/react-vite"
import { fn } from "storybook/test"
import { MemoryRouter } from "react-router-dom"

import { Button } from "./index"

const meta = {
  title: "Legacy/Buttons/Button",
  component: Button,
  tags: ["autodocs"],
  args: {
    title: "Continue",
    onClick: fn(),
  },
  parameters: {
    layout: "centered",
  },
} satisfies Meta<typeof Button>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: (args) => (
    <div className="w-[280px]">
      <Button {...args} />
    </div>
  ),
}

export const Loading: Story = {
  args: {
    loading: true,
    title: "Saving",
  },
  render: (args) => (
    <div className="w-[280px]">
      <Button {...args} />
    </div>
  ),
}

export const Disabled: Story = {
  args: {
    disabled: true,
  },
  render: (args) => (
    <div className="w-[280px]">
      <Button {...args} />
    </div>
  ),
}

export const AsLink: Story = {
  args: {
    href: "/auth/login",
    title: "Go to login",
  },
  render: (args) => (
    <MemoryRouter>
      <div className="w-[280px]">
        <Button {...args} />
      </div>
    </MemoryRouter>
  ),
}
