import type { Meta, StoryObj } from "@storybook/react-vite"

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from "./select"

const meta = {
  title: "UI/Form/Select",
  component: Select,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
  },
} satisfies Meta<typeof Select>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  render: () => (
    <Select defaultValue="personal">
      <SelectTrigger className="w-56">
        <SelectValue placeholder="Select workspace" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>Workspace</SelectLabel>
          <SelectItem value="personal">Personal</SelectItem>
          <SelectItem value="family">Family</SelectItem>
          <SelectItem value="team">Team</SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
  ),
}

export const WithSections: Story = {
  render: () => (
    <Select defaultValue="weekly">
      <SelectTrigger className="w-56">
        <SelectValue placeholder="Select digest frequency" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>Frequent</SelectLabel>
          <SelectItem value="daily">Daily</SelectItem>
          <SelectItem value="weekly">Weekly</SelectItem>
        </SelectGroup>
        <SelectSeparator />
        <SelectGroup>
          <SelectLabel>Less frequent</SelectLabel>
          <SelectItem value="monthly">Monthly</SelectItem>
          <SelectItem value="never">Never</SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
  ),
}
