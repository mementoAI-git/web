import type { Meta, StoryObj } from "@storybook/react-vite"
import { SearchIcon } from "lucide-react"

import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  InputGroupText,
  InputGroupTextarea,
} from "./input-group"

const meta = {
  title: "UI/Form/InputGroup",
  component: InputGroup,
  tags: ["autodocs"],
  parameters: {
    layout: "centered",
  },
} satisfies Meta<typeof InputGroup>

export default meta
type Story = StoryObj<typeof meta>

export const WithAddons: Story = {
  render: () => (
    <div className="w-96">
      <InputGroup>
        <InputGroupAddon align="inline-start">
          <SearchIcon />
        </InputGroupAddon>
        <InputGroupInput placeholder="Search memories..." />
        <InputGroupAddon align="inline-end">
          <InputGroupText>⌘K</InputGroupText>
        </InputGroupAddon>
      </InputGroup>
    </div>
  ),
}

export const WithActionButton: Story = {
  render: () => (
    <div className="w-96">
      <InputGroup>
        <InputGroupInput placeholder="Email" />
        <InputGroupAddon align="inline-end">
          <InputGroupButton size="xs">Verify</InputGroupButton>
        </InputGroupAddon>
      </InputGroup>
    </div>
  ),
}

export const TextareaLayout: Story = {
  render: () => (
    <div className="w-96">
      <InputGroup>
        <InputGroupTextarea rows={4} placeholder="Add detailed notes..." />
      </InputGroup>
    </div>
  ),
}
