import type { Meta, StoryObj } from "@storybook/react-vite"

import { Progress } from "./progress"

const meta = {
  title: "UI/Feedback/Progress",
  component: Progress,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
  },
  args: {
    value: 40,
  },
  argTypes: {
    value: {
      control: { type: "range", min: 0, max: 100, step: 1 },
    },
  },
} satisfies Meta<typeof Progress>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: (args) => <Progress {...args} className="w-80" />,
}

export const Milestones: Story = {
  render: () => (
    <div className="w-80 space-y-3">
      <Progress value={15} />
      <Progress value={50} />
      <Progress value={85} />
    </div>
  ),
}
